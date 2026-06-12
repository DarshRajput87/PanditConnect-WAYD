'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
import { addMaterial, updateMaterial, deleteMaterial } from '@/actions/pandit-services'
import type { MaterialDTO } from '@/types/dashboard'

interface Props {
  poojaId: string
  initialMaterials: MaterialDTO[]
  /** Lets the parent (e.g. the service row badge) track the live count. */
  onCountChange?: (count: number) => void
}

type Draft = { itemName: string; quantity: string; notes: string }
const emptyDraft: Draft = { itemName: '', quantity: '', notes: '' }

const inputClass =
  'h-8 w-full rounded-md border border-neutral-200 px-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500'

export function ServiceMaterials({ poojaId, initialMaterials, onCountChange }: Props) {
  const router = useRouter()
  const { t } = useTranslation()
  const [materials, setMaterialsState] = useState(initialMaterials)
  const [adding, setAdding] = useState(false)
  const [newItem, setNewItem] = useState<Draft>(emptyDraft)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Draft>(emptyDraft)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  function setMaterials(next: MaterialDTO[]) {
    setMaterialsState(next)
    onCountChange?.(next.length)
  }

  async function handleAdd() {
    if (!newItem.itemName.trim() || !newItem.quantity.trim()) return
    setBusy(true)
    setError('')
    const result = await addMaterial(poojaId, {
      itemName: newItem.itemName.trim(),
      quantity: newItem.quantity.trim(),
      notes: newItem.notes.trim() || undefined,
    })
    if ('error' in result) {
      setError(t(`panditDash.errors.${result.error.code}`))
    } else {
      setMaterials([...materials, result.material])
      setNewItem(emptyDraft)
      setAdding(false)
      router.refresh()
    }
    setBusy(false)
  }

  async function handleUpdate(materialId: string) {
    if (!editValues.itemName.trim() || !editValues.quantity.trim()) return
    setBusy(true)
    setError('')
    const result = await updateMaterial(materialId, {
      itemName: editValues.itemName.trim(),
      quantity: editValues.quantity.trim(),
      notes: editValues.notes.trim() || undefined,
    })
    if ('error' in result) {
      setError(t(`panditDash.errors.${result.error.code}`))
    } else {
      setMaterials(
        materials.map((m) =>
          m._id === materialId
            ? {
                ...m,
                itemName: editValues.itemName.trim(),
                quantity: editValues.quantity.trim(),
                notes: editValues.notes.trim() || undefined,
              }
            : m
        )
      )
      setEditingId(null)
      router.refresh()
    }
    setBusy(false)
  }

  async function handleDelete(materialId: string) {
    setError('')
    const prev = materials
    setMaterials(materials.filter((m) => m._id !== materialId)) // optimistic
    const result = await deleteMaterial(materialId)
    if ('error' in result) {
      setMaterials(prev) // revert
      setError(t(`panditDash.errors.${result.error.code}`))
    } else {
      router.refresh()
    }
  }

  function startEdit(m: MaterialDTO) {
    setEditingId(m._id)
    setEditValues({ itemName: m.itemName, quantity: m.quantity, notes: m.notes ?? '' })
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-600">
          {t('panditDash.services.materialsTitle')}
        </p>
        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex items-center gap-1 text-xs font-medium text-orange-600 hover:text-orange-700"
          >
            <Plus className="h-3 w-3" />
            {t('panditDash.services.addMaterial')}
          </button>
        )}
      </div>

      {materials.length === 0 && !adding && (
        <p className="py-2 text-xs text-neutral-400">
          {t('panditDash.services.noMaterials')}{' '}
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="text-orange-600 hover:underline"
          >
            {t('panditDash.services.addFirstMaterial')}
          </button>
        </p>
      )}

      <div className="mb-3 space-y-2">
        {materials.map((m) =>
          editingId === m._id ? (
            <div key={m._id} className="space-y-2 rounded-lg border border-neutral-200 bg-white p-3">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={editValues.itemName}
                  onChange={(e) => setEditValues((p) => ({ ...p, itemName: e.target.value }))}
                  placeholder={t('panditDash.services.itemName')}
                  className={inputClass}
                />
                <input
                  type="text"
                  value={editValues.quantity}
                  onChange={(e) => setEditValues((p) => ({ ...p, quantity: e.target.value }))}
                  placeholder={t('panditDash.services.quantityPlaceholder')}
                  className={inputClass}
                />
              </div>
              <input
                type="text"
                value={editValues.notes}
                onChange={(e) => setEditValues((p) => ({ ...p, notes: e.target.value }))}
                placeholder={t('panditDash.services.notesOptional')}
                className={inputClass}
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="rounded-md border border-neutral-200 px-3 py-1.5 text-xs text-neutral-600 hover:bg-neutral-50"
                >
                  {t('panditDash.serviceForm.cancel')}
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdate(m._id)}
                  disabled={busy || !editValues.itemName.trim() || !editValues.quantity.trim()}
                  className="flex items-center gap-1.5 rounded-md bg-orange-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-orange-600 disabled:opacity-50"
                >
                  {busy && <Loader2 className="h-3 w-3 animate-spin" />}
                  {busy ? t('panditDash.serviceForm.saving') : t('panditDash.serviceForm.save')}
                </button>
              </div>
            </div>
          ) : (
            <div key={m._id} className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white px-3 py-2.5">
              <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-orange-400" />
              <p className="min-w-0 flex-1 truncate text-xs">
                <span className="font-medium text-neutral-900">{m.itemName}</span>
                <span className="ml-2 text-neutral-400">{m.quantity}</span>
                {m.notes && <span className="ml-2 text-neutral-400">· {m.notes}</span>}
              </p>
              <div className="flex flex-shrink-0 gap-1">
                <button
                  type="button"
                  onClick={() => startEdit(m)}
                  className="rounded-md p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
                  aria-label={t('panditDash.services.editMaterialAria', { name: m.itemName })}
                >
                  <Pencil className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(m._id)}
                  className="rounded-md p-1.5 text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-600"
                  aria-label={t('panditDash.services.deleteMaterialAria', { name: m.itemName })}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          )
        )}
      </div>

      {adding && (
        <div className="space-y-2 rounded-lg border border-orange-200 bg-white p-3">
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={newItem.itemName}
              onChange={(e) => setNewItem((p) => ({ ...p, itemName: e.target.value }))}
              placeholder={`${t('panditDash.services.itemName')} *`}
              className={inputClass}
              autoFocus
            />
            <input
              type="text"
              value={newItem.quantity}
              onChange={(e) => setNewItem((p) => ({ ...p, quantity: e.target.value }))}
              placeholder={`${t('panditDash.services.quantityPlaceholder')} *`}
              className={inputClass}
            />
          </div>
          <input
            type="text"
            value={newItem.notes}
            onChange={(e) => setNewItem((p) => ({ ...p, notes: e.target.value }))}
            placeholder={t('panditDash.services.notesOptional')}
            className={inputClass}
          />
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setAdding(false)
                setNewItem(emptyDraft)
              }}
              className="rounded-md border border-neutral-200 px-3 py-1.5 text-xs text-neutral-600 hover:bg-neutral-50"
            >
              {t('panditDash.serviceForm.cancel')}
            </button>
            <button
              type="button"
              onClick={handleAdd}
              disabled={busy || !newItem.itemName.trim() || !newItem.quantity.trim()}
              className="flex items-center gap-1.5 rounded-md bg-orange-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-orange-600 disabled:opacity-50"
            >
              {busy && <Loader2 className="h-3 w-3 animate-spin" />}
              {busy ? t('panditDash.services.adding') : t('panditDash.services.addMaterial')}
            </button>
          </div>
        </div>
      )}

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  )
}
