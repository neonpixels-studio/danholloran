---
date: "2026-10-16T02:15:03.000-07:00"
tags: ["obsidian", "plugins", "workflows", "obsidian-api-and-themes"]
draft: false
title: "Obsidian Keychain: Get Your API Keys Out of data.json"
image: "/images/posts/obsidian-keychain-get-your-api-keys-out-of-data-json.jpg"
topic: "obsidian"
description: "Obsidian's Keychain gives plugins one shared, device-local place to keep API keys instead of plaintext in data.json. Here's how it works, what it fixes, and where it still trips people up."
---

Open your vault folder, find `.obsidian/plugins/`, and look inside a few `data.json` files. If you use any AI, sync, or publishing plugin, there is a good chance you will find an API key sitting there in plain text. That file lives inside your vault, which means it rides along with whatever you use to sync or back up that vault: iCloud, Obsidian Sync, a Git repo you push to GitHub. Most of us never meant to publish our OpenAI key to a private repo, but plenty of us have.

There is a second, more boring problem too. If three plugins all talk to the same service, you paste the same key three times. When you rotate it, you hunt down all three. Obsidian's **Keychain**, added in the 1.11 release cycle, is the app's answer to both.

## What the Keychain actually is

Keychain is a built-in settings section, not a Community plugin. You will find it under **Settings -> Keychain**. It is a simple list of named secrets: you give a secret a name like `openai-personal` and paste the value once.

Plugins never see that list unless they ask for a specific name. In Obsidian 1.11.4 the team exposed a `SecretStorage` API and a matching `SecretComponent` for plugin settings screens. The [1.11.4 changelog](https://obsidian.md/changelog/2026-01-07-desktop-v1.11.4/) describes the intent plainly: instead of copy-pasting the same Google or OpenAI key into several plugins, plugins fetch it from a shared collection identified by a user-provided name.

The important detail is _where_ the value lives. Per the [developer guide](https://docs.obsidian.md/plugins/guides/secret-storage), a plugin's settings now store only the **name** of the secret. The value itself lives in the app's local storage on that device, keyed to the vault. It is not a file in your vault folder, so it does not get committed, synced, or zipped up with a backup.

## What changes in a plugin that supports it

From the user side, a supporting plugin swaps its plain text box for a picker. You choose an existing secret or create a new one right there, and the plugin remembers the name.

If you write plugins, the change is small. The official guide's pattern looks like this:

```ts
import { Notice, SecretComponent, Setting } from "obsidian";

new Setting(containerEl)
  .setName("API key")
  .setDesc("Pick a secret from your Keychain")
  .addComponent((el) =>
    new SecretComponent(this.app, el)
      .setValue(this.plugin.settings.apiKeySecret)
      .onChange(async (name) => {
        this.plugin.settings.apiKeySecret = name; // the name, not the key
        await this.plugin.saveSettings();
      }),
  );
```

Then, at the moment you actually need the key:

```ts
const key = this.app.secretStorage.getSecret(this.settings.apiKeySecret);
if (!key) {
  new Notice("No API key found. Add one under Settings -> Keychain.");
  return;
}
```

`SecretComponent` uses `addComponent` rather than an `addText`-style helper because it needs the `App` instance to reach the store. Plan for `getSecret` returning `null`; it will on any device where the user has not set the secret yet.

Adoption is already happening. Plugins like Agent Client and Gemini Helper have shipped migrations that move an existing key out of `data.json` into the Keychain and only delete the plaintext copy after the save succeeds. That is the pattern to copy if you maintain a plugin.

## The tradeoffs nobody mentions up front

**It is per device.** Because secrets live in local app storage, they do not sync. Set up a new laptop or open your vault on your phone and you will need to add the secret again on that device. For a lot of people that is the point; for others it is a surprise the first time a plugin says the key is missing.

**It only helps once your plugins adopt it.** If a plugin still has a plain text field, the key still goes into `data.json`. A March 2026 [forum thread](https://forum.obsidian.md/t/what-is-obsidian-keychain-and-how-to-use-it/112408) captures the frustration well: the setting exists, but until each plugin developer opts in, there is nothing for it to hold. There are no environment variables or placeholders to bridge the gap.

**Migration can break synced setups.** A developer in that same thread pointed out that moving a field from synced settings to device-local secrets quietly breaks anyone who relied on syncing plugin settings across machines. Some plugins will likely offer both a plain field and a Keychain picker for a while.

**Watch the multi-vault edge cases on mobile.** In August 2026 a plugin author [reported](https://forum.obsidian.md/t/secretstorage-appears-to-be-shared-across-vaults-on-mobile-but-vault-scoped-on-desktop/117793) that secrets with the same name stayed isolated per vault on desktop but appeared to overwrite each other across vaults on mobile. Until that is clarified, give secrets distinct names per vault (`work-openai`, `personal-openai`) if you run more than one.

## Where to start

Do a five-minute audit. Search your `.obsidian/plugins/*/data.json` files for anything that looks like a key or token, check whether each plugin now offers a Keychain picker, and move the ones that do. Rotate any key that has already been committed or synced somewhere you would not want it. If you maintain a plugin, the [SecretStorage guide](https://docs.obsidian.md/plugins/guides/secret-storage) is short enough to read over coffee, and your users' Git histories will thank you.
