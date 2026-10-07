// happy-dom refuses to fetch <script src> and reports it as an error. Treat the
// disabled load as a success so the script element still attaches silently.
export function silenceScriptLoading() {
  const settings = (
    window as unknown as {
      happyDOM: { settings: { handleDisabledFileLoadingAsSuccess: boolean } };
    }
  ).happyDOM.settings;
  settings.handleDisabledFileLoadingAsSuccess = true;
}
