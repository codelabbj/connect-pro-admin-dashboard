# Implementation Guide: can_process_ussd_transaction Feature

## 1. Frontend: Registration Form

### Add to Form State
```typescript
const [form, setForm] = useState({
  // ... other fields
  can_process_ussd_transaction: false, // Add this line
})
```

### Add Checkbox in Form
```tsx
<div className="flex items-center mb-2">
  <input
    type="checkbox"
    name="can_process_ussd_transaction"
    checked={form.can_process_ussd_transaction}
    onChange={handleChange}
    id="can_process_ussd_transaction"
    className="mr-2"
  />
  <label htmlFor="can_process_ussd_transaction">
    {t("register.allowTransaction") || "Allow Transaction"}
  </label>
</div>
```

### Include in Submit Payload
```typescript
const submitBody = {
  // ... other fields
  can_process_ussd_transaction: form.can_process_ussd_transaction, // Add this
}
```

### Reset Form After Success
```typescript
setForm({
  // ... other fields
  can_process_ussd_transaction: false, // Add this to reset
})
```

---

## 2. Frontend: User List/Details Page

### Add State Variables
```typescript
const [verifyingUssd, setVerifyingUssd] = useState(false);
const [confirmUssdToggle, setConfirmUssdToggle] = useState<null | boolean>(null);
```

### Add Toggle Handler Function
```typescript
const handleToggleUssdTransaction = async (canProcess: boolean) => {
  if (!detailUser?.uid) return;
  setVerifyingUssd(true);
  try {
    const data = await apiFetch(`${baseUrl.replace(/\/$/, "")}/api/auth/admin/users/${detailUser.uid}/update/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ can_process_ussd_transaction: canProcess }),
    });
    setDetailUser((prev: any) => prev ? { ...prev, can_process_ussd_transaction: canProcess } : prev);
    toast({ 
      title: t("users.ussdToggled"), 
      description: canProcess ? t("users.ussdEnabledSuccessfully") : t("users.ussdDisabledSuccessfully") 
    });
  } catch (err: any) {
    toast({ 
      title: t("users.ussdToggleFailed"), 
      description: extractErrorMessages(err), 
      variant: "destructive" 
    });
  } finally {
    setVerifyingUssd(false);
  }
};
```

### Add to User Details Display
```tsx
<div>
  <b>{t("users.canProcessUssdTransaction") || "Can Process USSD Transaction"}:</b> 
  {detailUser.can_process_ussd_transaction ? t("common.yes") : t("common.no")}
  <Switch
    checked={detailUser.can_process_ussd_transaction}
    disabled={detailLoading || verifyingUssd}
    onCheckedChange={() => setConfirmUssdToggle(!detailUser.can_process_ussd_transaction)}
    className="ml-2"
  />
</div>
```

### Add Confirmation Modal
```tsx
{/* USSD Transaction Toggle Confirmation Modal */}
<Dialog open={confirmUssdToggle !== null} onOpenChange={(open) => { if (!open) setConfirmUssdToggle(null) }}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>
        {confirmUssdToggle 
          ? t("users.enableUssdTransaction") || "Enable USSD Transaction" 
          : t("users.disableUssdTransaction") || "Disable USSD Transaction"}
      </DialogTitle>
    </DialogHeader>
    <div className="py-4 text-center">
      {confirmUssdToggle
        ? t("users.confirmEnableUssdTransaction") || "Are you sure you want to enable USSD transaction processing for this user?"
        : t("users.confirmDisableUssdTransaction") || "Are you sure you want to disable USSD transaction processing for this user?"}
    </div>
    <DialogFooter>
      <Button
        className="w-full"
        onClick={async () => {
          await handleToggleUssdTransaction(!!confirmUssdToggle);
          setConfirmUssdToggle(null);
        }}
        disabled={verifyingUssd}
      >
        {verifyingUssd ? t("users.verifying") : t("common.ok")}
      </Button>
      <Button
        variant="outline"
        className="w-full mt-2"
        onClick={() => setConfirmUssdToggle(null)}
        disabled={verifyingUssd}
      >
        {t("common.cancel")}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

## 3. Backend: API Endpoint

Your PATCH endpoint should accept and update the field:

```typescript
// In your user update endpoint
export async function PATCH(request: Request, { params }: { params: { uid: string } }) {
  try {
    const data = await request.json();
    const uid = params.uid;
    
    // Update user with can_process_ussd_transaction field
    const updatedUser = await updateUser(uid, {
      can_process_ussd_transaction: data.can_process_ussd_transaction,
    });
    
    return NextResponse.json(updatedUser);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}
```

---

## 4. Database Schema

Add this field to your user table/model:

```sql
-- SQL example
ALTER TABLE users ADD COLUMN can_process_ussd_transaction BOOLEAN DEFAULT FALSE;
```

Or in your ORM/Model:

```typescript
// Example with Prisma
model User {
  // ... other fields
  can_process_ussd_transaction Boolean @default(false)
}

// Example with TypeORM
@Column({ type: 'boolean', default: false })
can_process_ussd_transaction: boolean;
```

---

## 5. Translations/Localization

Add these translation keys:

```json
{
  "register": {
    "allowTransaction": "Allow Transaction"
  },
  "users": {
    "canProcessUssdTransaction": "Can Process USSD Transaction",
    "ussdToggled": "USSD Status Updated",
    "ussdEnabledSuccessfully": "USSD transaction enabled successfully",
    "ussdDisabledSuccessfully": "USSD transaction disabled successfully",
    "ussdToggleFailed": "Failed to update USSD status",
    "enableUssdTransaction": "Enable USSD Transaction",
    "disableUssdTransaction": "Disable USSD Transaction",
    "confirmEnableUssdTransaction": "Are you sure you want to enable USSD transaction processing for this user?",
    "confirmDisableUssdTransaction": "Are you sure you want to disable USSD transaction processing for this user?",
    "verifying": "Verifying..."
  }
}
```

---

## Summary of Changes Needed

### Files to Modify/Create:

1. **Registration Form Component**
   - Add field to state
   - Add checkbox to UI
   - Include in submit body

2. **User List/Details Page**
   - Add state variables
   - Add toggle handler
   - Add display with Switch component
   - Add confirmation modal

3. **Backend API**
   - Update user update endpoint to handle the field

4. **Database**
   - Add column to users table

5. **Translations**
   - Add all translation keys listed above

### Dependencies Needed:
- Dialog component (for confirmation modal)
- Switch component (for toggle UI)
- Toast notifications
- API fetch utility

