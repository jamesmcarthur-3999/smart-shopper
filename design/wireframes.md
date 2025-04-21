# Smart Shopper UI Wireframes

This document outlines the core UI components and layout for the Smart Shopper application. It provides a reference for the visual structure that canvas operations should target.

## Main Layout Components

```
+-----------------------------------------------+
|                  HEADER                       |
+-----------------------------------------------+
|                                |              |
|                                |              |
|          PRODUCT               |    CHAT      |
|          CANVAS                |    WINDOW    |
|                                |              |
|                                |              |
+-----------------------------------------------+
|                  FOOTER                       |
+-----------------------------------------------+
```

## 1. Chat Window

Located on the right side of the screen, the chat window is where users interact with Claude:

```
+----------------------------------+
| Shopping Assistant              |
+----------------------------------+
|                                  |
|  [Claude's message]              |
|                                  |
|  [User's message]                |
|                                  |
|  [Claude's response with         |
|   product recommendations]       |
|                                  |
+----------------------------------+
|                                  |
|  Type your shopping query...     |
|                             SEND |
+----------------------------------+
```

### Chat Window Requirements:
- Clean, minimal design
- Clear distinction between user and Claude messages
- Support for markdown in messages
- Support for actionable links to control canvas

## 2. Product Canvas

The main display area on the left where product cards and comparisons are visualized:

```
+-----------------------------------------------+
| FILTERS & SORT                                |
+-----------------------------------------------+
|                                               |
|  +--------+    +--------+    +--------+       |
|  | PRODUCT|    | PRODUCT|    | PRODUCT|       |
|  | CARD 1 |    | CARD 2 |    | CARD 3 |       |
|  +--------+    +--------+    +--------+       |
|                                               |
|  +--------+    +--------+    +--------+       |
|  | PRODUCT|    | PRODUCT|    | PRODUCT|       |
|  | CARD 4 |    | CARD 5 |    | CARD 6 |       |
|  +--------+    +--------+    +--------+       |
|                                               |
+-----------------------------------------------+
```

### Product Canvas Requirements:
- Responsive grid layout with multiple view options (grid, list, comparison)
- Support for highlighting recommended products
- Interactive elements (hover states, expanded views)
- Consistent card dimensions and spacing

## 3. Product Card

Individual product cards displayed on the canvas:

```
+---------------------------+
|                           |
|       PRODUCT IMAGE       |
|                           |
+---------------------------+
| Product Title             |
| $XX.XX                    |
+---------------------------+
| Rating: ★★★★☆ (123)       |
| Source: [Source]          |
+---------------------------+
| [VIEW DETAILS] [ADD TO    |
|               FAVORITES]  |
+---------------------------+
```

### Product Card Requirements:
- Consistent aspect ratio for images (1:1 recommended)
- Clear hierarchy: image → title → price → metadata
- Optional elements (rating, review count, tags)
- Action buttons with hover states

## 4. Comparison View

When comparing multiple products side-by-side:

```
+----------------------------------------------------------+
|              PRODUCT COMPARISON                           |
+----------------------------------------------------------+
|             | Product 1     | Product 2     | Product 3   |
+-------------+---------------+---------------+-------------+
| Image       | [IMAGE]       | [IMAGE]       | [IMAGE]     |
+-------------+---------------+---------------+-------------+
| Price       | $XX.XX        | $XX.XX        | $XX.XX      |
+-------------+---------------+---------------+-------------+
| Rating      | ★★★★☆ (123)   | ★★★☆☆ (45)    | ★★★★★ (67)  |
+-------------+---------------+---------------+-------------+
| Material    | Value         | Value         | Value       |
+-------------+---------------+---------------+-------------+
| Feature 1   | Value         | Value         | Value       |
+-------------+---------------+---------------+-------------+
| Pros        | List of pros  | List of pros  | List of pros|
+-------------+---------------+---------------+-------------+
```

### Comparison View Requirements:
- Tabular layout with consistent column widths
- Highlighted cells for best values in each row
- Support for different data types (text, numeric, rating)
- Scrollable for many attributes or products

## 5. Gallery View

For visual-focused browsing of products:

```
+-----------------------------------------------+
|                                               |
|     +-----------------------------------+     |
|     |                                   |     |
|     |           FEATURED PRODUCT        |     |
|     |                                   |     |
|     +-----------------------------------+     |
|                                               |
|  +--------+  +--------+  +--------+  +---+   |
|  | THUMB 1|  | THUMB 2|  | THUMB 3|  |MORE|   |
|  +--------+  +--------+  +--------+  +---+   |
|                                               |
+-----------------------------------------------+
```

### Gallery View Requirements:
- Large feature image with thumbnails below
- Quick navigation between products
- Image zoom capabilities
- Support for multiple product images

## Canvas Operation Mappings

The canvas operations from §5 in the Project Instructions map to these UI elements as follows:

1. `add_card` - Creates a new product card and adds it to the canvas
2. `update_grid` - Changes the layout and visible products in the canvas
3. `highlight_choice` - Visually emphasizes a recommended product
4. `undo_last` - Reverts the previous canvas operation

## Responsive Breakpoints

| Breakpoint | Layout Change |
|------------|---------------|
| < 768px    | Stack chat below canvas, single column products |
| 768-1024px | Side-by-side layout, 2 products per row |
| > 1024px   | Side-by-side layout, 3 products per row |

## Theme Parameters

| Element | Property | Value |
|---------|----------|-------|
| Text - Primary | Color | #333333 |
| Text - Secondary | Color | #666666 |
| Background - Canvas | Color | #FFFFFF |
| Background - Chat | Color | #F8F9FA |
| Accent - Primary | Color | #4285F4 |
| Accent - Secondary | Color | #34A853 |
| Card Shadow | Box-shadow | 0 2px 5px rgba(0,0,0,0.1) |
| Border Radius | - | 8px |

---

_Last updated: 2025-04-21_

_Note: These wireframes are initial drafts. User feedback and usability testing will inform refinements to this design._