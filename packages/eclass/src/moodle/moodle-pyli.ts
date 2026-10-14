import type { Apotelesma, EclassPyli, HttpAitima, HttpPyli, KomvosArxeiou, Mathima } from '@dps/core';
import { apotyxia, ok } from '@dps/core';
import { CookieDiaxeiristis } from '../auth/cookie-diaxeiristis.js';

const TIMEOUT_MS = 30_000;
const MAX_COURSE_HTML = 8 * 1024 * 1024;
const ALLOWED_FILES = new Set(['pdf', 'pptx', 'docx', 'txt', 'md', 'odt', 'odp', 'rtf']);

export interface MoodlePyliOptions {
  readonly http: HttpPyli;
  readonly base_url: string;
  readonly username: string;
  readonly password: string;
  readonly webservice_token?: string;
}

interface Link {
  readonly href: string;
  readonly label: string;
}

function decodeHtml(text: string): string {
  return text
    .replace(/&#x([\da-f]+);/gi, (_, hex: string) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 10)))
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}

function plainText(html: string): string {
  return decodeHtml(html.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')).trim();
}

function attribute(tag: string, name: string): string | null {
  const match = new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i').exec(tag);
  return match?.[1] ?? match?.[2] ?? match?.[3] ?? null;
}

function links(html: string): Link[] {
  const result: Link[] = [];
  const anchor = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  for (let match = anchor.exec(html); match !== null; match = anchor.exec(html)) {
    const href = attribute(match[1] ?? '', 'href');
    if (href !== null) result.push({ href: decodeHtml(href), label: plainText(match[2] ?? '') });
  }
  return result;
}

function allFileReferences(html: string): string[] {
  const values: string[] = [];
  const tags = /<(?:a|iframe|object|source|img)\b[^>]*>/gi;
  for (let match = tags.exec(html); match !== null; match = tags.exec(html)) {
    const tag = match[0] ?? '';
    for (const name of ['href', 'src', 'data']) {
      const value = attribute(tag, name);
      if (value !== null && /(?:pluginfile\.php|\/mod\/(?:resource|folder|page)\/)/i.test(value)) {
        values.push(decodeHtml(value));
      }
    }
  }
  return [...new Set(values)];
}

function extension(path: string): string {
  const name = path.split('/').at(-1)?.split('?')[0] ?? '';
  const dot = name.lastIndexOf('.');
  return dot < 0 ? '' : name.slice(dot + 1).toLowerCase();
}

function cleanPath(value: string): string {
  const withoutControls = Array.from(value.normalize('NFC'), (character) => {
    const codePoint = character.codePointAt(0) ?? 0;
    return codePoint < 0x20 || codePoint === 0x7f ? '-' : character;
  }).join('');
  return withoutControls.replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, ' ').trim() || 'Υλικό';
}

function moodleError(json: unknown): string | null {
  if (typeof json !== 'object' || json === null) return null;
  const record = json as Record<string, unknown>;
  if (typeof record.message === 'string' && (typeof record.exception === 'string' || 'errorcode' in record)) {
    return record.message;
  }
  return null;
}

/** Standard Moodle web login and course/resource crawler. SSO-only portals fail explicitly. */
export class MoodlePyli implements EclassPyli {
  readonly base_url: string;
  private readonly cookieJar = new CookieDiaxeiristis();
  private readonly origin: string;
  private authenticated = false;

  constructor(private readonly options: MoodlePyliOptions) {
    const base = new URL(options.base_url);
    if (base.protocol !== 'https:') throw new Error('Moodle LMS must use HTTPS.');
    this.base_url = base.href.replace(/\/$/, '');
    this.origin = base.origin;
  }

  pare_kefalides_lipshs(): Record<string, string> {
    const cookie = this.cookieJar.pare_kefalida();
    return cookie === undefined ? {} : { cookie };
  }

  async syndesi(): Promise<Apotelesma<void>> {
    if (this.options.webservice_token?.trim()) {
      const site = await this.webservice<unknown>('core_webservice_get_site_info', {});
      if (!site.ok) return site;
      const message = moodleError(site.timi);
      if (message !== null) return apotyxia('AUTH_APOTYXIA', `Το Moodle web service token απορρίφθηκε: ${message}`);
      this.authenticated = true;
      return ok(undefined);
    }
    if (!this.options.username.trim() || !this.options.password) {
      return apotyxia('AUTH_APOTYXIA', 'Συμπλήρωσε όνομα χρήστη και κωδικό Moodle.');
    }

    const loginUrl = `${this.base_url}/login/index.php`;
    const formResponse = await this.request({ methodos: 'GET', url: loginUrl, typos_apantisis: 'keimeno' });
    if (!formResponse.ok) return formResponse;
    const html = formResponse.timi.keimeno ?? '';
    if (html.length > MAX_COURSE_HTML) return apotyxia('MI_EGKYRO_SXIMA', 'Η σελίδα σύνδεσης Moodle είναι υπερβολικά μεγάλη.');
    const form = /<form\b([^>]*)>([\s\S]*?)<\/form>/gi;
    let loginForm: { attributes: string; html: string } | null = null;
    for (let match = form.exec(html); match !== null; match = form.exec(html)) {
      const body = match[2] ?? '';
      if (/name\s*=\s*["']username["']/i.test(body) && /name\s*=\s*["']password["']/i.test(body)) {
        loginForm = { attributes: match[1] ?? '', html: body };
        break;
      }
    }
    if (loginForm === null) {
      if (/saml|shibboleth|oauth2|single sign.on|identity provider/i.test(html)) {
        return apotyxia('MI_YPOSTIRIZOMENO', 'Αυτό το Moodle χρησιμοποιεί SSO. Η σύνδεση SSO δεν υποστηρίζεται ακόμη· χρησιμοποίησε Moodle username/password login.');
      }
      return apotyxia('MI_YPOSTIRIZOMENO', 'Δεν αναγνωρίστηκε η τυπική φόρμα Moodle username/password.');
    }

    const actionValue = attribute(loginForm.attributes, 'action') ?? loginUrl;
    const action = new URL(actionValue, loginUrl);
    if (action.origin !== this.origin || action.protocol !== 'https:') {
      return apotyxia('MI_YPOSTIRIZOMENO', 'Η φόρμα Moodle οδηγεί σε εξωτερική υπηρεσία σύνδεσης (SSO).');
    }
    const fields: Record<string, string> = { username: this.options.username, password: this.options.password };
    const hidden = /<input\b([^>]*)>/gi;
    for (let match = hidden.exec(loginForm.html); match !== null; match = hidden.exec(loginForm.html)) {
      const tag = match[1] ?? '';
      const type = (attribute(tag, 'type') ?? '').toLowerCase();
      const name = attribute(tag, 'name');
      if (name !== null && (type === 'hidden' || type === 'submit')) {
        fields[name] = decodeHtml(attribute(tag, 'value') ?? '');
      }
    }
    const buttons = /<button\b([^>]*)>[\s\S]*?<\/button>/gi;
    for (let match = buttons.exec(loginForm.html); match !== null; match = buttons.exec(loginForm.html)) {
      const tag = match[1] ?? '';
      const type = (attribute(tag, 'type') ?? 'submit').toLowerCase();
      const name = attribute(tag, 'name');
      if (type === 'submit' && name !== null) fields[name] = decodeHtml(attribute(tag, 'value') ?? '');
    }
    const login = await this.request({ methodos: 'POST', url: action.href, soma_forma: fields, typos_apantisis: 'keimeno' });
    if (!login.ok) return login;
    const loginHtml = login.timi.keimeno ?? '';
    if (login.timi.katastasi === 401 || login.timi.katastasi === 403 ||
        /loginerrormessage|invalid login|incorrect username or password/i.test(loginHtml) ||
        /\/login\/index\.php(?:\?|$)/i.test(login.timi.teliko_url)) {
      return apotyxia('AUTH_APOTYXIA', 'Αποτυχία σύνδεσης στο Moodle: έλεγξε τα στοιχεία ή το portal μπορεί να απαιτεί SSO.');
    }
    this.authenticated = true;
    return ok(undefined);
  }

  async fere_mathimata(): Promise<Apotelesma<Mathima[]>> {
    if (!this.authenticated) return apotyxia('AUTH_APOTYXIA', 'Πρέπει πρώτα να συνδεθείς στο Moodle.');
    if (this.options.webservice_token?.trim()) {
      const result = await this.webservice<unknown>('core_enrol_get_users_courses', { userid: '0' });
      if (!result.ok) return result;
      const message = moodleError(result.timi);
      if (message !== null) return apotyxia('MI_YPOSTIRIZOMENO', `Το Moodle δεν επέτρεψε την ανάκτηση μαθημάτων μέσω Web Services: ${message}`);
      if (!Array.isArray(result.timi)) return apotyxia('MI_EGKYRO_SXIMA', 'Το Moodle επέστρεψε μη έγκυρη λίστα μαθημάτων.');
      const courses: Mathima[] = [];
      for (const item of result.timi) {
        if (typeof item !== 'object' || item === null || !('id' in item) || !('fullname' in item) ||
            typeof item.id !== 'number' && typeof item.id !== 'string' || typeof item.fullname !== 'string') continue;
        const id = String(item.id);
        courses.push({ kodikos: id, titlos: item.fullname, url: `${this.base_url}/course/view.php?id=${encodeURIComponent(id)}`, epilegmeno: true });
      }
      return courses.length > 0 ? ok(courses) : apotyxia('DEN_VRETHIKE', 'Δεν βρέθηκαν εγγεγραμμένα Moodle μαθήματα.');
    }

    const response = await this.request({ methodos: 'GET', url: `${this.base_url}/my/courses.php`, typos_apantisis: 'keimeno' });
    if (!response.ok) return response;
    const html = response.timi.keimeno ?? '';
    if (html.length > MAX_COURSE_HTML) return apotyxia('MI_EGKYRO_SXIMA', 'Η λίστα Moodle είναι υπερβολικά μεγάλη.');
    const courses = new Map<string, Mathima>();
    for (const link of links(html)) {
      let url: URL;
      try { url = new URL(link.href, this.base_url); } catch { continue; }
      const id = url.searchParams.get('id');
      if (url.origin !== this.origin || !/\/course\/view\.php$/i.test(url.pathname) || !id || !/^\d+$/.test(id)) continue;
      const title = link.label || `Μάθημα ${id}`;
      if (!courses.has(id)) courses.set(id, { kodikos: id, titlos: title, url: url.href, epilegmeno: true });
    }
    return courses.size > 0 ? ok([...courses.values()]) : apotyxia('DEN_VRETHIKE', 'Δεν βρέθηκαν μαθήματα στη σελίδα My Courses του Moodle.');
  }

  async fere_dentro_arxeion(courseId: string): Promise<Apotelesma<KomvosArxeiou[]>> {
    if (!this.authenticated) return apotyxia('AUTH_APOTYXIA', 'Πρέπει πρώτα να συνδεθείς στο Moodle.');
    if (!/^\d+$/.test(courseId)) return apotyxia('MI_EGKYRO_SXIMA', 'Το Moodle course ID δεν είναι έγκυρο.');
    if (this.options.webservice_token?.trim()) return this.courseContentsFromApi(courseId);

    const courseUrl = `${this.base_url}/course/view.php?id=${encodeURIComponent(courseId)}`;
    const course = await this.request({ methodos: 'GET', url: courseUrl, typos_apantisis: 'keimeno' });
    if (!course.ok) return course;
    const html = course.timi.keimeno ?? '';
    if (html.length > MAX_COURSE_HTML) return apotyxia('MI_EGKYRO_SXIMA', 'Το Moodle μάθημα ξεπερνά το όριο ανάγνωσης HTML.');
    const nodes: KomvosArxeiou[] = [{ typos: 'fakelos', onoma: '', diadromi: '', url: courseUrl, megethos: null, imerominia: null }];
    const seen = new Set<string>();
    const moduleLinks = links(html).filter(({ href }) => /\/mod\/(?:resource|folder|page)\/view\.php/i.test(href));
    const references = allFileReferences(html);
    for (const reference of references) await this.addFileReference(reference, 'Υλικό', nodes, seen);
    for (const [index, link] of moduleLinks.entries()) {
      const title = cleanPath(link.label || `Υλικό ${index + 1}`);
      let moduleUrl: URL;
      try { moduleUrl = new URL(link.href, this.base_url); } catch { continue; }
      if (moduleUrl.origin !== this.origin || moduleUrl.protocol !== 'https:') continue;
      const modulePage = await this.request({ methodos: 'GET', url: moduleUrl.href, typos_apantisis: 'keimeno' });
      if (!modulePage.ok) continue;
      const body = modulePage.timi.keimeno ?? '';
      if (body.length > MAX_COURSE_HTML) continue;
      if (/\/mod\/resource\/view\.php/i.test(moduleUrl.pathname) && body.length === 0) {
        await this.addFileReference(modulePage.timi.teliko_url, title, nodes, seen);
      }
      for (const reference of allFileReferences(body)) await this.addFileReference(reference, title, nodes, seen);
    }
    return ok(nodes);
  }

  private async courseContentsFromApi(courseId: string): Promise<Apotelesma<KomvosArxeiou[]>> {
    const result = await this.webservice<unknown>('core_course_get_contents', { courseid: courseId });
    if (!result.ok) return result;
    const message = moodleError(result.timi);
    if (message !== null) return apotyxia('MI_YPOSTIRIZOMENO', `Το Moodle δεν έδωσε περιεχόμενα μέσω Web Services: ${message}`);
    if (!Array.isArray(result.timi)) return apotyxia('MI_EGKYRO_SXIMA', 'Το Moodle επέστρεψε μη έγκυρη δομή ενοτήτων.');
    const nodes: KomvosArxeiou[] = [{ typos: 'fakelos', onoma: '', diadromi: '', url: `${this.base_url}/course/view.php?id=${courseId}`, megethos: null, imerominia: null }];
    for (const section of result.timi) {
      if (typeof section !== 'object' || section === null || !('name' in section) || typeof section.name !== 'string' || !('modules' in section) || !Array.isArray(section.modules)) continue;
      const sectionName = cleanPath(section.name || 'Ενότητα');
      nodes.push({ typos: 'fakelos', onoma: sectionName, diadromi: sectionName, url: `${this.base_url}/course/view.php?id=${courseId}`, megethos: null, imerominia: null });
      for (const module of section.modules) {
        if (typeof module !== 'object' || module === null || !('name' in module) || typeof module.name !== 'string' || !('contents' in module) || !Array.isArray(module.contents)) continue;
        for (const content of module.contents) {
          if (typeof content !== 'object' || content === null || !('type' in content) || content.type !== 'file' ||
              !('fileurl' in content) || typeof content.fileurl !== 'string' || !('filename' in content) || typeof content.filename !== 'string') continue;
          const fileUrl = new URL(content.fileurl);
          if (fileUrl.origin !== this.origin || fileUrl.protocol !== 'https:' || !ALLOWED_FILES.has(extension(fileUrl.pathname))) continue;
          const path = `${sectionName}/${cleanPath(module.name)}/${cleanPath(content.filename)}`;
          const size = 'filesize' in content && typeof content.filesize === 'number' ? content.filesize : null;
          nodes.push({ typos: 'arxeio', onoma: content.filename, diadromi: path, url: fileUrl.href, megethos: size, imerominia: null });
        }
      }
    }
    return ok(nodes);
  }

  private async addFileReference(reference: string, folder: string, nodes: KomvosArxeiou[], seen: Set<string>): Promise<void> {
    let url: URL;
    try { url = new URL(reference, this.base_url); } catch { return; }
    if (url.origin !== this.origin || url.protocol !== 'https:') return;
    let resolved = url;
    if (!/pluginfile\.php/i.test(url.pathname)) {
      const head = await this.request({ methodos: 'HEAD', url: url.href, typos_apantisis: 'keimeno' });
      if (head.ok) {
        try { resolved = new URL(head.timi.teliko_url); } catch { return; }
      } else {
        const fetched = await this.request({ methodos: 'GET', url: url.href, typos_apantisis: 'keimeno' });
        if (!fetched.ok || !fetched.timi.keimeno) return;
        for (const nested of allFileReferences(fetched.timi.keimeno)) await this.addFileReference(nested, folder, nodes, seen);
        return;
      }
    }
    const ext = extension(resolved.pathname);
    if (resolved.origin !== this.origin || resolved.protocol !== 'https:' || !/pluginfile\.php/i.test(resolved.pathname) || !ALLOWED_FILES.has(ext)) return;
    const pathParts = resolved.pathname.split('/').filter(Boolean);
    const filename = decodeHtml(pathParts.at(-1) ?? `resource.${ext}`);
    const path = `${cleanPath(folder)}/${cleanPath(filename)}`;
    if (seen.has(path)) return;
    seen.add(path);
    nodes.push({ typos: 'arxeio', onoma: filename, diadromi: path, url: resolved.href, megethos: null, imerominia: null });
  }

  private async webservice<T>(functionName: string, parameters: Record<string, string>): Promise<Apotelesma<T>> {
    const url = new URL('webservice/rest/server.php', `${this.base_url}/`);
    const form: Record<string, string> = {
      wstoken: this.options.webservice_token?.trim() ?? '',
      wsfunction: functionName,
      moodlewsrestformat: 'json',
      ...parameters,
    };
    const response = await this.request({
      methodos: 'POST',
      url: url.href,
      soma_forma: form,
      typos_apantisis: 'keimeno',
    });
    if (!response.ok) return response;
    try {
      return ok(JSON.parse(response.timi.keimeno ?? '') as T);
    } catch {
      return apotyxia('MI_EGKYRO_SXIMA', 'Το Moodle Web Service επέστρεψε μη έγκυρο JSON.');
    }
  }

  private async request(input: {
    readonly methodos: HttpAitima['methodos'];
    readonly url: string;
    readonly typos_apantisis: HttpAitima['typos_apantisis'];
    readonly soma_forma?: Record<string, string>;
  }): Promise<Apotelesma<import('@dps/core').HttpApantisi>> {
    let url: URL;
    try { url = new URL(input.url); } catch { return apotyxia('MI_EGKYRO_SXIMA', 'Μη έγκυρη διεύθυνση Moodle.'); }
    if (url.origin !== this.origin || url.protocol !== 'https:') return apotyxia('MI_YPOSTIRIZOMENO', 'Το Moodle προσπάθησε να ανακατευθύνει εκτός της ασφαλούς πύλης του.');
    const cookie = this.cookieJar.pare_kefalida();
    const request: HttpAitima = {
      methodos: input.methodos,
      url: url.href,
      kefalides: { accept: input.typos_apantisis === 'keimeno' ? 'text/html,application/json' : '*/*', ...(cookie ? { cookie } : {}) },
      akolouthise_anakateuthinseis: true,
      xronos_orio_ms: TIMEOUT_MS,
      typos_apantisis: input.typos_apantisis,
      ...(input.soma_forma ? { soma_forma: input.soma_forma } : {}),
    };
    const response = await this.options.http.aitima(request);
    if (!response.ok) return response;
    this.cookieJar.apothikefse_apo_kefalides(response.timi.kefalides);
    try {
      if (new URL(response.timi.teliko_url).origin !== this.origin) return apotyxia('MI_YPOSTIRIZOMENO', 'Η Moodle σύνδεση ανακατευθύνθηκε σε εξωτερικό SSO.');
    } catch { return apotyxia('MI_EGKYRO_SXIMA', 'Το Moodle επέστρεψε μη έγκυρη τελική διεύθυνση.'); }
    return response;
  }
}
