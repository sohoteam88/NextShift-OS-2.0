export async function writeClipboardText(
  text: string,
  clipboard: Pick<Clipboard, 'writeText'> = navigator.clipboard,
) {
  await clipboard.writeText(text);
}
