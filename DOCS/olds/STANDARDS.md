# OFM Development Standards

**Rule**: Follow these standards for consistent, maintainable code.

---

## 🎨 CSS Standards

### Global CSS Only - NO Component Styles

**RULE:** ❌ **DO NOT use `<style>` tags in `.svelte` files**

**Why:**
- All reusable styles are centralized in `global.css`
- Animations like `.fade-in` are already available
- Custom button colors (`.btn-view`, `.btn-cancel`, `.btn-edit`) are already defined
- Easier to maintain and update

**✅ ALL styles are in Global CSS (`src/lib/styles/global.css`):**
- Buttons (`.btn-primary`, `.btn-secondary`, `.btn-danger`, `.btn-view`, `.btn-cancel`, `.btn-edit`)
- Badges (`.badge`, `.badge-pending`, `.badge-success`, etc.)
- Status badges (`.status-badge`, `.status-blue`, `.status-green`, etc.)
- Forms (`.form-grid`, `.form-group`, `.form-actions`, `.checkbox-group`)
- Cards & Panels (`.card`, `.panel`)
- Animations (`.fade-in`, `.slide-up`)
- Utility classes (`.text-center`, `.mb-2`, `.flex`, `.gap-1`, etc.)

**❌ NEVER do this:**
```svelte
<style>
	/* ❌ Bad - NO style tags allowed */
	.my-custom-style {
		padding: 1rem;
	}
</style>
```

**✅ ALWAYS do this instead:**
```svelte
<!-- ✅ Good - Use global classes -->
<div class="card flex gap-1 fade-in">
	<button class="btn-primary">Save</button>
	<button class="btn-secondary">Cancel</button>
</div>
```

**If you need a truly unique style:**
1. Check if it can be achieved with global classes first
2. If not, add it to `global.css` to make it reusable
3. NEVER add `<style>` tags to components

### Using Global Classes in DataTable

For custom cell rendering in DataTable:

```svelte
const columns = [
  {
    key: 'status',
    label: 'Status',
    render: (val) => `<span class="badge badge-${val}">${val}</span>`
  }
];
```

Global badge/status classes are automatically available.

---

## 🪟 Modal & Form Standards

### When to Create a Separate Form Component

**✅ Create separate component when:**
- **10+ fields** (complex form)
- **Conditional fields** (show/hide based on other fields)
- **Complex validation** (cross-field validation)
- **Reused in multiple places**

**✅ Use inline form when:**
- **< 10 fields** (simple form)
- **Static fields** (no conditional logic)
- **Simple validation** (per-field only)
- **Used in one place only**

### Examples

**Separate Component (Complex):**
```
/meeting/bookings → Uses MeetingBookingForm.svelte
- 15+ fields
- Conditional fields (offline/online/hybrid)
- Room availability checking
- Participant management
```

**Inline Form (Simple):**
```
/admin/vehicles → Inline in Modal
- 5 fields (plateNumber, model, type, capacity, isActive)
- No conditional logic
- Simple required validation
```

### Standard Pattern

**1. Simple Form (Inline in Page):**

```svelte
<script lang="ts">
  import DataTable from '$lib/components/DataTable.svelte';
  import Modal from '$lib/components/Modal.svelte';

  let isModalOpen = $state(false);
  let editingItem: any = null;
  let formData = $state({
    name: '',
    email: '',
    isActive: true
  });

  function openAddModal() {
    editingItem = null;
    resetForm();
    isModalOpen = true;
  }

  function openEditModal(item: any) {
    editingItem = item;
    formData = { ...item }; // Pre-fill form
    isModalOpen = true;
  }

  function resetForm() {
    formData = { name: '', email: '', isActive: true };
  }

  async function handleSubmit(event: Event) {
    event.preventDefault();
    const url = editingItem ? `/api/v1/items/${editingItem._id}` : '/api/v1/items';
    const method = editingItem ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    if (response.ok) {
      isModalOpen = false;
      window.location.reload(); // Or refetch data
    }
  }
</script>

<DataTable
  {columns}
  apiEndpoint="/api/v1/items"
  onAdd={openAddModal}
  onEdit={openEditModal}
/>

<Modal
  bind:isOpen={isModalOpen}
  title={editingItem ? 'Edit Item' : 'Add Item'}
  onClose={() => isModalOpen = false}
>
  <form onsubmit={handleSubmit} class="form-grid">
    <div class="form-group">
      <label for="name">Name *</label>
      <input type="text" id="name" bind:value={formData.name} required />
    </div>

    <div class="form-actions">
      <button type="button" class="btn-secondary" onclick={() => isModalOpen = false}>
        Cancel
      </button>
      <button type="submit" class="btn-primary">
        {editingItem ? 'Update' : 'Create'}
      </button>
    </div>
  </form>
</Modal>
```

**2. Complex Form (Separate Component):**

```svelte
<!-- +page.svelte -->
<script lang="ts">
  import DataTable from '$lib/components/DataTable.svelte';
  import Modal from '$lib/components/Modal.svelte';
  import ComplexForm from '$lib/components/ComplexForm.svelte';

  let showFormModal = $state(false);
  let selectedItem: any = null;

  function openCreateModal() {
    selectedItem = null;
    showFormModal = true;
  }

  function openEditModal(item: any) {
    selectedItem = item;
    showFormModal = true;
  }

  function handleFormSuccess() {
    showFormModal = false;
    window.location.reload();
  }
</script>

<DataTable
  {columns}
  apiEndpoint="/api/v1/items"
  onAdd={openCreateModal}
  actions={[
    { label: 'View/Edit', class: 'btn-view', onClick: openEditModal }
  ]}
/>

<Modal
  bind:isOpen={showFormModal}
  title={selectedItem ? 'Edit Item' : 'Create Item'}
  onClose={() => showFormModal = false}
  width="80%"
>
  <ComplexForm
    item={selectedItem}
    onSuccess={handleFormSuccess}
    onCancel={() => showFormModal = false}
  />
</Modal>
```

```svelte
<!-- ComplexForm.svelte -->
<script lang="ts">
  interface Props {
    item: any | null;
    onSuccess: () => void;
    onCancel: () => void;
  }

  let { item = null, onSuccess, onCancel }: Props = $props();

  // Mode detection
  const isEditMode = item?._id != null;

  // Initialize form with item data or defaults
  let formData = $state({
    field1: item?.field1 || '',
    field2: item?.field2 || '',
    // ... 15+ fields
  });

  async function handleSubmit(event: Event) {
    event.preventDefault();
    const url = isEditMode ? `/api/v1/items/${item._id}` : '/api/v1/items';
    const method = isEditMode ? 'PATCH' : 'POST';

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    if (response.ok) {
      onSuccess();
    }
  }
</script>

<form onsubmit={handleSubmit} class="form-grid">
  <!-- 10+ form fields here -->

  <div class="form-actions">
    <button type="button" class="btn-secondary" onclick={onCancel}>Cancel</button>
    <button type="submit" class="btn-primary">
      {isEditMode ? 'Update' : 'Create'}
    </button>
  </div>
</form>
```

---

## 🔄 Edit-as-View Pattern

**Concept:** The "Edit" button actually opens the same form for both viewing and editing. There's no separate "View" mode.

### Why This Pattern?

1. **DRY** - One form handles both view and edit
2. **Simplicity** - No need to duplicate fields in read-only view
3. **User Experience** - Users can view data and immediately edit if needed

### Implementation

**Key Principle:** The same form component is used for create, view, and edit. The mode is determined by the presence of data.

```svelte
<script lang="ts">
  let selectedBooking: any = null; // null = create, object = edit/view
  let showFormModal = $state(false);

  function openCreateModal() {
    selectedBooking = null; // null triggers create mode
    showFormModal = true;
  }

  function openEditModal(booking: any) {
    selectedBooking = booking; // object triggers edit mode (also serves as view)
    showFormModal = true;
  }
</script>

<DataTable
  actions={[
    {
      label: 'View/Edit',  // ⭐ One button for both!
      class: 'btn-view',
      onClick: openEditModal
    }
  ]}
  onAdd={openCreateModal}
/>

<Modal
  bind:isOpen={showFormModal}
  title={selectedBooking ? 'Edit Booking' : 'Create Booking'}
  onClose={closeModal}
  width="80%"
>
  <BookingForm
    booking={selectedBooking}  <!-- null = create, object = edit -->
    onSuccess={handleFormSuccess}
    onCancel={closeModal}
  />
</Modal>
```

**In the Form Component:**

```svelte
<script lang="ts">
  interface Props {
    booking: any | null; // null = create mode
    onSuccess: () => void;
    onCancel: () => void;
  }

  let { booking = null, onSuccess, onCancel }: Props = $props();

  // Detect mode based on presence of _id
  const isEditMode = booking?._id != null;

  // Pre-fill form in edit mode, or use defaults in create mode
  let formData = $state({
    title: booking?.title || '',
    type: booking?.type || 'offline',
    startTime: booking?.startTime || '',
    // ... more fields
  });

  async function handleSubmit(event: Event) {
    event.preventDefault();

    const url = isEditMode
      ? `/api/v1/bookings/${booking._id}`  // PATCH for edit
      : '/api/v1/bookings';                 // POST for create

    const method = isEditMode ? 'PATCH' : 'POST';

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    if (response.ok) {
      onSuccess();
    }
  }
</script>

<form onsubmit={handleSubmit} class="form-grid">
  <div class="form-group">
    <label for="title">Title *</label>
    <input
      type="text"
      id="title"
      bind:value={formData.title}
      required
    />
  </div>

  <!-- More fields... -->

  <div class="form-actions">
    <button type="button" class="btn-secondary" onclick={onCancel}>
      Cancel
    </button>
    <button type="submit" class="btn-primary">
      {isEditMode ? 'Update' : 'Create'}
    </button>
  </div>
</form>
```

### Read-Only Fields in Edit Mode

For fields that shouldn't be edited (like auto-generated IDs):

```svelte
<div class="form-group">
  <label for="requestNumber">Request Number</label>
  <input
    type="text"
    id="requestNumber"
    bind:value={formData.requestNumber}
    disabled={isEditMode}  <!-- Disabled in edit mode -->
    placeholder="Auto-generated"
  />
</div>
```

### Benefits

✅ **Less Code** - One form instead of separate view/edit forms
✅ **Consistency** - Same layout for view and edit
✅ **Better UX** - Seamless transition from viewing to editing
✅ **Maintainability** - Changes in one place

---

## 📏 Modal Width Standards

**Default:** `600px` (good for simple forms)

**When to override:**
- **Complex forms (10+ fields):** `width="80%"`
- **Very complex forms (20+ fields):** `width="90%"`
- **Simple forms (< 5 fields):** `width="500px"` (optional)

**Example:**
```svelte
<Modal
  bind:isOpen={isModalOpen}
  title="Create Booking"
  onClose={closeModal}
  width="80%"  <!-- Complex form with many fields -->
>
  <MeetingBookingForm ... />
</Modal>
```

---

## ✅ Checklist: Before Creating a Form

- [ ] Is this form < 10 fields? → **Use inline form in page**
- [ ] Is this form 10+ fields? → **Create separate component**
- [ ] Does it need create + edit? → **Use edit-as-view pattern**
- [ ] Are there conditional fields? → **Create separate component**
- [ ] Will it be reused? → **Create separate component**
- [ ] Using global CSS classes? → **Check `global.css` first**
- [ ] Need custom width? → **Set `width` prop on Modal**

---

## 📚 Real Examples in OFM

| Page | Pattern | Form Type | Width | Complexity |
|------|---------|-----------|-------|------------|
| `/admin/vehicles` | Inline | Simple | Default | 5 fields |
| `/admin/companies` | Inline | Simple | Default | 7 fields |
| `/meeting/bookings` | Separate Component | Complex | 80% | 15+ fields |
| `/transportation/bookings` | View-only Modal | N/A | Default | Display only |

---

## 🎯 Summary

1. **CSS**: Use `global.css` for reusable styles, component CSS for page-specific
2. **Forms**: Inline for simple (< 10 fields), separate component for complex (10+)
3. **Edit-as-View**: One form for create/view/edit, mode detected by presence of data
4. **Modal Width**: Default 600px, override to 80% for complex forms
5. **Always check** `DOCS/REUSABLES.md` before writing new code
