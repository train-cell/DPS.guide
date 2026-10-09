import { describe, expect, it } from 'vitest';
import { patch_plist } from './patch-plist.mjs';

const KLEIDIA_ORIZONTAS = ['UIFileSharingEnabled', 'LSSupportsOpeningDocumentsInPlace'];

/** Ρεαλιστικό αντίγραφο του Capacitor Info.plist — το %s αντικαθίσταται από το block των keys. */
const PROTIPO_PLI = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
\t<key>CFBundleDevelopmentRegion</key>
\t<string>en</string>
\t<key>CFBundleDisplayName</key>
\t<string>DPS.guide</string>
\t<key>CFBundleExecutable</key>
\t<string>$(EXECUTABLE_NAME)</string>
\t<key>CFBundleIdentifier</key>
\t<string>$(PRODUCT_BUNDLE_IDENTIFIER)</string>
\t<key>CFBundleInfoDictionaryVersion</key>
\t<string>6.0</string>
\t<key>CFBundleName</key>
\t<string>$(PRODUCT_NAME)</string>
\t<key>CFBundlePackageType</key>
\t<string>APPL</string>
\t<key>CFBundleShortVersionString</key>
\t<string>1.0</string>
\t<key>CFBundleVersion</key>
\t<string>1</string>
\t<key>LSRequiresIPhoneOS</key>
\t<true/>
\t<key>NSAppTransportSecurity</key>
\t<dict>
\t\t<key>NSAllowsArbitraryLoads</key>
\t\t<true/>
\t</dict>
\t<key>UILaunchStoryboardName</key>
\t<string>LaunchScreen</string>
\t<key>UIRequiredDeviceCapabilities</key>
\t<array>
\t\t<string>armv7</string>
\t</array>
\t<key>UISupportedInterfaceOrientations</key>
\t<array>
\t\t<string>UIInterfaceOrientationPortrait</string>
\t</array>
\t<key>UISupportedInterfaceOrientations~ipad</key>
\t<array>
\t\t<string>UIInterfaceOrientationPortrait</string>
\t</array>%s
</dict>
</plist>
`;

function plist(keimena_dyadion = ''): string {
  const mesa = keimena_dyadion === '' ? '' : `\n${keimena_dyadion}`;
  return PROTIPO_PLI.replace('%s', () => mesa);
}

function blok_kleidion(timi: string): string {
  return KLEIDIA_ORIZONTAS.map((kleydi) => `\t<key>${kleydi}</key>\n\t${timi}`).join('\n');
}

function timi_kleidiou(keimeno: string, kleydi: string): string | null {
  const taima = new RegExp(`<key>${kleydi}</key>\\s*(<[^>]*/>)`).exec(keimeno);
  return taima === null ? null : (taima[1] ?? null);
}

function poses_fores(keimeno: string, ypokeimeno: string): number {
  return keimeno.split(ypokeimeno).length - 1;
}

describe('patch_plist', () => {
  it('αντικαθιστά υπάρχουσες <false/> τιμές με <true/>', () => {
    const patched = patch_plist(plist(blok_kleidion('<false/>')));

    expect(timi_kleidiou(patched, 'UIFileSharingEnabled')).toBe('<true/>');
    expect(timi_kleidiou(patched, 'LSSupportsOpeningDocumentsInPlace')).toBe('<true/>');
    expect(patched).not.toContain('<false/>');
  });

  it('αντικαθιστά τιμές τύπου string με <true/>', () => {
    const patched = patch_plist(plist(blok_kleidion('<string>Yes</string>')));

    expect(timi_kleidiou(patched, 'UIFileSharingEnabled')).toBe('<true/>');
    expect(timi_kleidiou(patched, 'LSSupportsOpeningDocumentsInPlace')).toBe('<true/>');
    expect(patched).not.toContain('<string>Yes</string>');
  });

  it('εισάγει τα λείποντα keys πριν το τελικό </dict>', () => {
    const protipo = plist();
    const patched = patch_plist(protipo);

    expect(poses_fores(patched, '<key>')).toBe(poses_fores(protipo, '<key>') + KLEIDIA_ORIZONTAS.length);
    expect(patched).toContain(
      '\t<key>UIFileSharingEnabled</key>\n\t<true/>\n\t<key>LSSupportsOpeningDocumentsInPlace</key>\n\t<true/>\n</dict>\n</plist>\n',
    );
    // η εισαγωγή γίνεται στο κύριο dict, όχι στο εσωτερικό NSAppTransportSecurity
    expect(patched.lastIndexOf('</dict>')).toBeGreaterThan(patched.indexOf('<key>UIFileSharingEnabled</key>'));
  });

  it('είναι idempotent', () => {
    const me_false = patch_plist(plist(blok_kleidion('<false/>')));
    const me_true = patch_plist(plist(blok_kleidion('<true/>')));
    const xoris_kleidia = patch_plist(plist());

    expect(patch_plist(me_false)).toBe(me_false);
    expect(patch_plist(me_true)).toBe(me_true);
    expect(patch_plist(xoris_kleidia)).toBe(xoris_kleidia);
  });

  it('κρατά τα υπόλοιπα keys αναλλοίωτα', () => {
    const patched = patch_plist(plist());

    expect(patched).toContain('\t<key>CFBundleIdentifier</key>\n\t<string>$(PRODUCT_BUNDLE_IDENTIFIER)</string>');
    expect(patched).toContain('\t<key>CFBundleShortVersionString</key>\n\t<string>1.0</string>');
    expect(patched).toContain('\t<key>CFBundleDisplayName</key>\n\t<string>DPS.guide</string>');
    expect(patched).toContain('\t\t<key>NSAllowsArbitraryLoads</key>\n\t\t<true/>');
    expect(patched).toContain('\t<key>LSRequiresIPhoneOS</key>\n\t<true/>');
    expect(patched).toContain('\t<key>UISupportedInterfaceOrientations</key>\n\t<array>');
  });

  it('συντρέχει με <true/> αν τα keys είναι ήδη ενεργά', () => {
    const protipo = plist(blok_kleidion('<true/>'));

    expect(patch_plist(protipo)).toBe(protipo);
    expect(timi_kleidiou(patch_plist(protipo), 'UIFileSharingEnabled')).toBe('<true/>');
  });

  it('σεβάζεται CRLF αλλαγές γραμμής', () => {
    const protipo = plist(blok_kleidion('<false/>')).replace(/\n/g, '\r\n');
    const patched = patch_plist(protipo);

    expect(patch_plist(patched)).toBe(patched);
    expect(patched).toContain('\t<key>UIFileSharingEnabled</key>\r\n\t<true/>');
  });

  it('πετάει Error σε άκυρο XML χωρίς </dict>', () => {
    expect(() => patch_plist('<?xml version="1.0"?><plist version="1.0"></plist>')).toThrow(Error);
    expect(() => patch_plist('')).toThrow(/Άκυρο Info\.plist/);
    expect(() => patch_plist('<dict><key>x</key></dict>'.replace('</dict>', ''))).toThrow(Error);
  });
});
