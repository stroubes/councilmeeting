# Clerk Live Display Quick Reference

Use this guide during live meetings for fast, low-stress operation of agenda slides, motions, and presentations.

## 1) Start-of-Meeting Checklist

- Open clerk console: `/motions`
- Select the correct meeting from the top dropdown.
- Open public screen on TV/monitors: `/public/live-meeting/:meetingId`
- Confirm one of the mode buttons is highlighted to match what is currently live.
- Keep this page open on the clerk computer for full control.

## 2) Display Modes

- **Show Agenda**: displays the selected agenda slide.
- **Show Presentation**: displays uploaded presentation slides.
- **Show Live Motion**: displays currently live motion text and outcomes.

The highlighted mode button always shows the active live mode.

## 3) Quick Keyboard Controls

- `N`: next slide (agenda or presentation)
- `P`: previous slide (agenda or presentation)
- `A`: switch to agenda mode
- `M`: switch to motion mode
- `R`: switch to presentation mode
- `C`: mark live motion `CARRIED`
- `D`: mark live motion `DEFEATED`
- `W`: mark live motion `WITHDRAWN`

## 4) Presenter Remote Support

When focus is not inside an input field, presenter remotes are supported:

- Next: `ArrowRight`, `ArrowDown`, `PageDown`, `Space`, `Enter`
- Previous: `ArrowLeft`, `ArrowUp`, `PageUp`, `Backspace`

## 5) Presentation Workflow

- Expand **Presentation Decks** section.
- Upload `.pdf`, `.ppt`, or `.pptx`.
- Click **Show Presentation** on the target deck.
- Use `Next Slide` / `Previous Slide` or presenter remote.
- Use **Go To Slide** for direct jump.
- If the wrong file was uploaded, click **Delete**.

Notes:

- PPT/PPTX uploads are converted to PDF on the backend.
- Backend host must have LibreOffice (`soffice` or `libreoffice`) installed.

## 6) Reduce Scrolling During Meetings

Use the section toggles to collapse/expand:

- **Agenda Slides**
- **Presentation Decks**
- **Motion Controls**

Collapse sections you are not actively using.

## 7) Fast Troubleshooting

- **Public screen not updating**: verify meeting id in URL and mode in `/motions`.
- **Slide looks stale after code updates**: hard refresh public screen (`Cmd+Shift+R`).
- **PPT/PPTX upload fails**: confirm LibreOffice is installed on backend host.
- **No hotkeys working**: click outside any input/textarea, then try again.

## 8) Recommended Live Operation Pattern

- Keep one clerk on `/motions`.
- Keep one stable public URL on all displays.
- Use mode buttons for big context switches (Agenda/Presentation/Motion).
- Use hotkeys/remotes for fast slide movement.
- Use toasts and the **Currently On Screen** panel to confirm each action.
