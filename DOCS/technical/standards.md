# Development Standards

---

## CSS: Global Only

**Rule:** No `<style>` tags in `.svelte` files. All styles in `src/lib/styles/global.css`.

**Available classes:**

| Category | Classes |
|----------|---------|
| Buttons | `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.btn-success`, `.btn-sm` |
| Actions | `.btn-view`, `.btn-cancel`, `.btn-edit` |
| Badges | `.badge`, `.badge-pending`, `.badge-approved`, `.badge-completed`, `.badge-cancelled` |
| Status | `.status-badge`, `.status-blue`, `.status-green`, `.status-red`, `.status-gray` |
| Forms | `.form-grid`, `.form-group`, `.form-actions`, `.checkbox-group` |
| Layout | `.card`, `.panel`, `.flex`, `.gap-1` |
| Utils | `.text-center`, `.text-muted`, `.mb-1`, `.mb-2`, `.fade-in`, `.slide-up` |

**Variables:** `--color-primary`, `--color-danger`, `--border-color`, `--radius-md`

If you need a unique style: add it to `global.css`, never to a component.

---

## Forms: Inline vs Separate Component

| Condition | Pattern |
|-----------|---------|
| < 10 fields, no conditional logic | Inline form in page |
| 10+ fields, conditional fields, reused | Separate component |

### Modal Width

| Complexity | Width |
|------------|-------|
| Simple (< 10 fields) | Default `600px` |
| Complex (10-20 fields) | `width="80%"` |
| Very complex (20+ fields) | `width="90%"` |

---

## Edit-as-View Pattern

One form handles create, view, and edit. Mode detected by presence of data:

- `item = null` → create mode (POST)
- `item._id` exists → edit mode (PATCH)

```svelte
<DataTable
  actions={[{ label: 'View/Edit', class: 'btn-view', onClick: openEditModal }]}
  onAdd={openCreateModal}
/>

<Modal bind:isOpen title={item ? 'Edit' : 'Create'} onClose={close} width="80%">
  <MyForm item={selectedItem} onSuccess={handleSuccess} onCancel={close} />
</Modal>
```

In the form, `isEditMode = item?._id != null` determines the HTTP method and URL.

Read-only fields in edit mode: `disabled={isEditMode}`.

---

## Styling Values

| Property | Value |
|----------|-------|
| Primary gradient | `#667eea` → `#764ba2` |
| Success | `#48bb78` |
| Error | `#e53e3e` |
| Background | `#f9fafb` |
| Border | `#e2e8f0` |
| Border radius | `6px`, `8px`, `12px` |
| Mobile breakpoint | `max-width: 768px` |

---

## Checklist

Before creating a form, verify:
1. Using global CSS classes? (no `<style>` tags)
2. Inline (< 10 fields) or separate component (10+)?
3. Using edit-as-view pattern?
4. Using DataTable + Modal (not custom table/dialog)?
5. Using client API wrapper (not raw fetch)?
6. Using `success()`/`error()` response format in APIs?
