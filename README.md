# Sileo-vanilla

[Live Demo](https://hamada147.github.io/sileo-vanilla/)

An opinionated, physics-based toast notification library. Zero dependencies, framework-free.

> **Vanilla JS port of [Sileo](https://github.com/hiaaryan/sileo)** by [@hiaaryan](https://github.com/hiaaryan) (Aaryan). All visual design, animations, and behavior are faithful to the original React library.

## Features

- Physics-based spring animations with gooey SVG morphing
- 6 toast states: `success`, `error`, `warning`, `info`, `action`, `loading`
- 6 viewport positions: `top-left`, `top-center`, `top-right`, `bottom-left`, `bottom-center`, `bottom-right`
- Promise-based async toasts (loading &rarr; success/error)
- Swipe-to-dismiss gesture
- Autopilot expand/collapse
- XSS-safe content rendering
- Full TypeScript support
- Zero dependencies

## Installation

### Warning: Haven't been published yet

```bash
npm install sileo-vanilla
```

## Quick Start

### ESM (bundler)

```js
import { sileo } from 'sileo-vanilla';
import 'sileo-vanilla/styles.css';

sileo.success({
  title: 'Saved',
  description: 'Your changes have been saved.',
});
```

### CDN (script tag)

#### Unpkg

```html
<link rel="stylesheet" href="https://unpkg.com/sileo-vanilla/dist/styles.css" />
<script src="https://unpkg.com/sileo-vanilla/dist/sileo.iife.js"></script>

<script>
  sileo.success({ title: 'Hello', description: 'World' });
</script>
```

#### JSDelivr

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/hamada147/sileo-vanilla/dist/styles.css" />
<script src="https://cdn.jsdelivr.net/gh/hamada147/sileo-vanilla/dist/sileo.iife.js"></script>

<script>
  sileo.success({ title: 'Hello', description: 'World' });
</script>
```

## API

### `sileo.init(options?)`

Optional. Initializes the toaster. Called automatically on first toast if omitted.

```js
sileo.init({
  position: 'top-right',    // Default position for all toasts
  offset: 16,               // Viewport offset in px (or a string like '1rem')
  options: {                 // Default options merged into every toast
    duration: 5000,
    roundness: 18,
  },
});
```

The `offset` option also accepts a per-side object:

```js
sileo.init({
  offset: { top: 20, right: 16 },
});
```

### `sileo.success(options)`

Show a success toast. Returns the toast `id`.

```js
const id = sileo.success({
  title: 'Uploaded',
  description: 'File saved successfully.',
});
```

### `sileo.error(options)`

```js
sileo.error({
  title: 'Error',
  description: 'Something went wrong.',
});
```

### `sileo.warning(options)`

```js
sileo.warning({
  title: 'Warning',
  description: 'Disk space running low.',
});
```

### `sileo.info(options)`

```js
sileo.info({
  title: 'Info',
  description: 'A new version is available.',
});
```

### `sileo.action(options)`

Show a toast with an interactive button.

```js
sileo.action({
  title: 'Deleted',
  description: 'The item was removed.',
  button: {
    title: 'Undo',
    onClick: () => restoreItem(),
  },
});
```

### `sileo.show(options)`

Show a toast with an explicit `state` field.

```js
sileo.show({
  title: 'Custom',
  state: 'info',
  position: 'bottom-center',
});
```

### `sileo.promise(promise, options)`

Bind a promise to a toast. Automatically transitions between loading, success, and error states.

```js
sileo.promise(
  fetch('/api/upload', { method: 'POST', body: formData }),
  {
    loading: { title: 'Uploading...' },
    success: { title: 'Uploaded', description: 'File saved.' },
    error:   { title: 'Failed', description: 'Upload failed.' },
  }
);
```

The `success` and `error` fields can also be functions that receive the resolved value or error:

```js
sileo.promise(fetch('/api/data'), {
  loading: { title: 'Loading...' },
  success: (data) => ({ title: 'Loaded', description: `Got ${data.length} items.` }),
  error:   (err)  => ({ title: 'Error',  description: err.message }),
});
```

### `sileo.dismiss(id)`

Dismiss a specific toast by its `id`.

```js
const id = sileo.success({ title: 'Hello' });
sileo.dismiss(id);
```

### `sileo.clear(position?)`

Clear all toasts, or only those at a specific position.

```js
sileo.clear();              // Clear all
sileo.clear('top-right');   // Clear only top-right toasts
```

## Toast Options

| Option | Type | Default | Description |
|---|---|---|---|
| `title` | `string` | — | Toast headline |
| `description` | `string \| HTMLElement` | — | Body content (string is auto-escaped; HTMLElement for rich content) |
| `position` | `SileoPosition` | `'top-right'` | Viewport anchor |
| `duration` | `number \| null` | `6000` | Auto-dismiss delay in ms. `null` = persistent |
| `icon` | `string \| HTMLElement \| null` | — | Custom icon (null uses default state icon) |
| `fill` | `string` | `'#FFFFFF'` | Toast background color |
| `roundness` | `number` | `18` | Border radius / gooey roundness |
| `autopilot` | `boolean \| { expand?, collapse? }` | `true` | Auto expand/collapse timing |
| `button` | `{ title, onClick }` | — | Action button (used with `action` state) |
| `styles` | `SileoStyles` | — | CSS class overrides for `title`, `description`, `badge`, `button` |

## Rich Content (XSS-Safe)

Strings passed as `description` are rendered via `textContent` (auto-escaped). For rich content, pass an `HTMLElement`:

```js
// Safe — string is auto-escaped
sileo.success({
  title: 'Note',
  description: '<script>alert("xss")</script>', // Rendered as plain text
});

// Rich content — you build the DOM
const el = document.createElement('div');
const strong = document.createElement('strong');
strong.textContent = 'report.pdf';
el.append('Your file ', strong, ' was uploaded.');

sileo.success({ title: 'Uploaded', description: el });
```

## Positions

```
┌──────────┬──────────┬──────────┐
│ top-left │top-center│top-right │
├──────────┼──────────┼──────────┤
│bot.-left │bot.-centr│bot.-right│
└──────────┴──────────┴──────────┘
```

## TypeScript

All types are exported:

```ts
import type {
  SileoOptions,
  SileoPosition,
  SileoState,
  SileoButton,
  SileoStyles,
  SileoInitOptions,
  SileoPromiseOptions,
} from 'sileo-vanilla';
```

## Credits

This library is a vanilla JavaScript port of [**sileo**](https://github.com/hiaaryan/sileo) by [**Aaryan**](https://github.com/hiaaryan). All credit for the original design, animations, and UX goes to the original author.

Vanilla port by [**Ahmed Moussa**](https://github.com/hamada147).

## License

[MIT](LICENSE)
