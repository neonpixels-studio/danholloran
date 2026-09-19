---
date: "2026-09-18T02:08:29.000-07:00"
tags:
  [
    "obsidian",
    "workflows",
    "linking",
    "plugins",
    "vault-organization-strategies",
  ]
draft: false
title: "Obsidian Attachments: Take Control of Where Your Files Actually Go"
image: "/images/posts/obsidian-attachments-take-control-of-where-your-files-go.jpg"
topic: "obsidian"
description: "Obsidian drops pasted images wherever its default setting says, which for most vaults means the root folder. Here is how the attachment location and link format settings interact, and how to clean up the pile you already have."
---

Open the file explorer in a vault you have used for a year and scroll to the bottom. If you see a wall of files named `Pasted image 20260918020412.png` sitting at the root next to your actual notes, you are not doing anything wrong. That is the default. Obsidian ships with new attachments going to the vault folder, and every screenshot, diagram, and dragged-in PDF has been piling up there since the day you started.

The fix is two settings that most people change once, badly, and never revisit. They are worth understanding together, because picking one without the other is how you end up with a tidy attachments folder full of broken embeds.

## The four attachment locations

Everything lives under **Settings → Files and links → Default location for new attachments**, and there are exactly four options:

- **Vault folder** — the root. The default, and the source of the mess described above.
- **In the folder specified below** — one central folder for every attachment in the vault, commonly `attachments/` or `_files/`.
- **Same folder as current file** — the attachment lands beside the note that embeds it.
- **In subfolder under current folder** — a named subfolder next to the note, created on demand if it does not exist.

The real decision is whether attachments are a **library** or **part of the note**. A central folder treats them as a library: one place to back up, one place to scan for junk, and no stray image folders cluttering your note tree. The cost is that filenames now have to be unique across the whole vault, and nothing in that folder tells you which note an image belongs to.

Same-folder and subfolder treat attachments as part of the note. Move a project folder and its images travel with it. Delete the folder and you delete its attachments too, with no orphans left behind. The cost is that your file explorer fills with small folders, and a note that lives in three places over its life leaves attachments scattered along the way.

If you are undecided, "In subfolder under current folder" with the subfolder name set to something that sorts out of the way is the safest default. Obsidian creates the folder only when you actually attach something, so notes without attachments stay clean:

```
Projects/
  Rewrite the API/
    Rewrite the API.md
    _attachments/
      sequence-diagram.png
```

## Link format is the other half of the decision

Directly above that setting is **New link format**, with three options: shortest path when possible, relative path to file, and absolute path in vault. It decides what Obsidian writes into `![[...]]` when you attach something, and it interacts with your location choice more than the settings screen suggests.

Shortest path pairs naturally with a central attachments folder, since one flat folder of uniquely named files is exactly the case where the shortest path is unambiguous. But it is also the format that bites you when two files share a name in different folders, because "shortest" stops being unique and Obsidian has to guess.

Relative paths pair with the same-folder and subfolder options. The link is written as `_attachments/diagram.png`, which means the note and its attachment folder can be moved, copied, or published as a self-contained unit, and the embed still resolves. That portability is the whole argument for keeping attachments next to notes.

One more toggle is doing quiet work underneath all of this: **Automatically update internal links**. Leave it on. It is what lets you drag an attachment to a new folder in the file explorer and have every embed pointing at it rewritten in place, which is what makes the cleanup below survivable at all.

## Cleaning up what you already have

Changing the setting only affects new attachments. The existing pile needs a migration, and the safe order is:

1. **Commit or back up first.** If your vault is in git, this is a one-line insurance policy. If it is not, copy the folder somewhere before you start.
2. **Confirm "Automatically update internal links" is on**, then move attachments inside Obsidian's own file explorer, not in Finder or Explorer. Obsidian only rewrites links for moves it can see. Files moved behind its back leave broken embeds everywhere.
3. **Find the orphans.** Attachments nothing links to are invisible in the graph and easy to miss. Community plugins like Consistent Attachments and Links, VaultPrune, and File Cleaner all scan for unreferenced files and let you review the list before anything is trashed. Review it properly. An "orphan" is often a file referenced by a raw Markdown path the scanner did not parse.

Budget twenty minutes, do it once, and the setting you picked at the top keeps it from happening again. Obsidian's own [Attachments help page](https://help.obsidian.md/attachments) is a good reference for the location options if you want to read the official wording before committing.
