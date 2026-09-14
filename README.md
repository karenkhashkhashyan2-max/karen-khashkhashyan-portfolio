# Karen Khashkhashyan Portfolio

A static portfolio for Karen Khashkhashyan, Product Designer in iGaming.
This export includes the current 22 projects, all game screenshots and thumbnails,
Russo One font, downloadable CV, and responsive category galleries.
Desktop displays two games per row; mobile displays one.

## Publish with GitHub Pages

1. Create a GitHub repository named `karen-khashkhashyan-portfolio`.
   A public repository works with GitHub Free.
2. Unzip this download. Upload the CONTENTS of this folder to the repository,
   including `index.html`, `style.css`, `app.js`, and the entire `assets` folder.
   `index.html` must be at the repository root, not inside another folder.
   Upload the files, not the ZIP archive. Commit the upload to `main`.
3. Open repository Settings > Pages.
4. Under Build and deployment, select Deploy from a branch.
5. Choose `main` and `/ (root)`, then Save.
6. GitHub shows the published website address on the Pages settings screen.
   Publishing may take up to ten minutes.

No build command, npm installation, backend, or API key is needed.

## Preview locally

Open `index.html` in a browser, or run `python3 -m http.server 8000`
from this directory and visit http://localhost:8000.

## Edit the website

- `index.html`: content, project cards, case studies, contact information, and links.
- `style.css`: typography, colors, spacing, responsive layouts.
- `app.js`: language switching, category grouping, and project dialogs.
- `assets/`: images, fonts and CV. Keep the folder structure intact.

Project cards use `data-category` for grouping. Supported current names include
`Bet-on Games`, `Table Games`, `Slots`, and `Betshop Games`.
New category names generate a new section heading automatically.
The latest Slots and Betshop case studies preserve the original English PDF text;
other existing translated content and translated interface labels are included.

The website uses Google Fonts for Manrope and Noto Sans Armenian and opens
external game links. These features require internet access. Russo One and all
project images are included locally.

## Ownership

Personal portfolio content belongs to Karen Khashkhashyan. Game artwork and
third-party brands retain their respective ownership. This export grants no
additional license to third-party game assets. The included font license is
provided with the font files.

## Future updates

This is an independent copy of the current portfolio. Later edits to the Sites
version will not automatically update GitHub, and vice versa.

Official instructions:
https://docs.github.com/en/pages/quickstart
https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository
