import { useMemo, useState } from "react";
import { AlertTriangle, Check, Package, Plus, RefreshCcw, X } from "lucide-react";
import { storageAPI } from "../../services/api";

const statusStyle = {
  LOW: "bg-[#F9B672]/15 text-[#7A5A2C]",
  CRITICAL: "bg-red-100 text-red-700",
  OK: "bg-[#2E6F4E]/10 text-[#2E6F4E]",
};

const emojiOptions = [
  "??", "???", "??", "??", "??", "??", "??", "??", "??", "??",
  "??", "??", "??", "??", "?", "??", "??", "??", "??", "??",
  "??", "??", "??", "??", "??", "??", "??", "??", "??", "???",
];

function RestockPanel({ items = [], loading = false, onRefresh }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [newItem, setNewItem] = useState({
    item_name: "",
    emoji: "??",
    current_stock: "",
    unit: "pcs",
    min_level: "",
  });

  const sortedItems = useMemo(() => {
    const priority = { CRITICAL: 0, LOW: 1, OK: 2 };
    return [...items].sort((left, right) => {
      const leftPriority = priority[String(left.status || "OK").toUpperCase()] ?? 2;
      const rightPriority = priority[String(right.status || "OK").toUpperCase()] ?? 2;
      return leftPriority - rightPriority;
    });
  }, [items]);

  const attentionItems = sortedItems.filter((item) => String(item.status || "OK").toUpperCase() !== "OK");

  const refreshInventory = async () => {
    await onRefresh?.();
  };

  const handleRestock = async (item) => {
    await storageAPI.updateStock(item.id, Number(item.min_level || 0) * 2);
    await refreshInventory();
  };

  const handleRestockAll = async () => {
    for (const item of attentionItems) {
      await storageAPI.updateStock(item.id, Number(item.min_level || 0) * 2);
    }
    await refreshInventory();
  };

  const handleAddItem = async () => {
    if (!newItem.item_name.trim()) return;

    setAddLoading(true);
    try {
      const stock = parseInt(newItem.current_stock, 10) || 0;
      const minLevel = parseInt(newItem.min_level, 10) || 10;

      let status = "OK";
      if (stock === 0 || stock < minLevel * 0.5) status = "CRITICAL";
      else if (stock < minLevel) status = "LOW";

      await storageAPI.add({
        item_name: newItem.item_name.trim(),
        emoji: newItem.emoji,
        current_stock: stock,
        unit: newItem.unit,
        min_level: minLevel,
        status,
      });

      setNewItem({
        item_name: "",
        emoji: "??",
        current_stock: "",
        unit: "pcs",
        min_level: "",
      });
      setShowAddModal(false);
      await refreshInventory();
    } catch (error) {
      console.error("Failed to add item:", error);
    }
    setAddLoading(false);
  };

  return (
    <section className="surface-panel surface-panel-pad xl:flex xl:max-h-[calc(100vh-13rem)] xl:flex-col xl:overflow-hidden">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="section-eyebrow">Restock details</p>
          <h3 className="mt-2 text-xl font-semibold text-[#050725]">Inventory attention panel</h3>
          <p className="section-copy">
            Review all low and critical stock items, then restock individually or in one action.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={refreshInventory}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#2C2F45]/10 bg-white/70 text-[#2C2F45] transition hover:bg-white"
            title="Refresh inventory"
          >
            <RefreshCcw size={15} />
          </button>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#2C2F45] text-[#F9B672] transition hover:bg-[#050725]"
            title="Add item"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="surface-card-soft px-4 py-4">
          <p className="text-xs uppercase tracking-[0.18em] text-[#84848A]">Items needing attention</p>
          <p className="mt-2 text-2xl font-semibold text-[#050725]">{loading ? "--" : attentionItems.length}</p>
        </div>
        <div className="surface-card-soft border border-[#F9B672]/20 bg-[#F9B672]/12 px-4 py-4">
          <p className="text-xs uppercase tracking-[0.18em] text-[#84848A]">Inventory total</p>
          <p className="mt-2 text-2xl font-semibold text-[#050725]">{loading ? "--" : sortedItems.length}</p>
        </div>
      </div>

      <div className="mt-6 space-y-3 xl:flex-1 xl:overflow-y-auto xl:pr-1">
        {loading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="animate-pulse rounded-[24px] border border-[#2C2F45]/8 bg-white/70 px-4 py-4">
              <div className="h-4 w-28 rounded bg-[#2C2F45]/10" />
              <div className="mt-3 h-3 w-40 rounded bg-[#2C2F45]/8" />
            </div>
          ))
        ) : sortedItems.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-[#2C2F45]/12 bg-white/45 px-5 py-10 text-center">
            <Package size={22} className="mx-auto text-[#F9B672]" />
            <p className="mt-4 text-sm font-semibold text-[#050725]">No inventory items yet</p>
            <p className="mt-2 text-sm leading-6 text-[#6F6F76]">Add an item to begin monitoring stock levels from this panel.</p>
          </div>
        ) : (
          sortedItems.map((item) => {
            const status = String(item.status || "OK").toUpperCase();
            return (
              <div
                key={item.id}
                className="flex items-center justify-between gap-4 rounded-[24px] border border-[#2C2F45]/8 bg-white/75 px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#ECDFC7] text-xl">
                    {item.emoji || "??"}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#050725]">{item.item_name}</p>
                    <p className="mt-1 text-xs text-[#84848A]">
                      Stock: {item.current_stock} / {item.min_level} {item.unit}
                    </p>
                    <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${statusStyle[status] || statusStyle.OK}`}>
                      {status}
                    </span>
                  </div>
                </div>

                {status !== "OK" ? (
                  <button
                    type="button"
                    onClick={() => handleRestock(item)}
                    className="inline-flex items-center gap-2 rounded-2xl border border-[#F9B672]/30 bg-[#F9B672]/12 px-3 py-2 text-xs font-semibold text-[#050725] transition hover:bg-[#F9B672]/18"
                  >
                    <Check size={13} />
                    Restock
                  </button>
                ) : (
                  <div className="inline-flex items-center gap-2 rounded-2xl bg-[#2E6F4E]/10 px-3 py-2 text-xs font-semibold text-[#2E6F4E]">
                    <Check size={13} />
                    Stable
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {attentionItems.length > 0 ? (
        <button
          type="button"
          onClick={handleRestockAll}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-[22px] bg-[#F9B672] px-4 py-3 text-sm font-semibold text-[#050725] transition hover:bg-[#efac68]"
        >
          <AlertTriangle size={16} />
          Restock All ({attentionItems.length})
        </button>
      ) : null}

      {showAddModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 backdrop-blur-[2px]">
          <div className="w-full max-w-md rounded-[30px] border border-white/70 bg-[#F4E9DA] p-6 shadow-[0_28px_80px_rgba(5,7,37,0.18)] sm:p-7">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#F9B672]">New inventory item</p>
                <h3 className="mt-2 text-xl font-semibold text-[#050725]">Add stock to monitor</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-[#84848A] transition hover:text-[#050725]"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="text-sm font-medium text-[#5F5F66]">Icon</label>
                <div className="mt-2 flex max-h-24 flex-wrap gap-1.5 overflow-y-auto rounded-2xl border border-[#2C2F45]/10 bg-white/70 p-3">
                  {emojiOptions.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setNewItem((previousState) => ({ ...previousState, emoji }))}
                      className={`flex h-9 w-9 items-center justify-center rounded-xl text-lg transition ${
                        newItem.emoji === emoji ? "bg-[#F9B672]/30" : "hover:bg-[#ECDFC7]"
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-[#5F5F66]">Item Name</label>
                <input
                  type="text"
                  placeholder="e.g. Cooking Oil"
                  value={newItem.item_name}
                  onChange={(event) => setNewItem((previousState) => ({ ...previousState, item_name: event.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-[#2C2F45]/10 bg-white px-4 py-3 text-sm text-[#050725] outline-none focus:border-[#F9B672]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-[#5F5F66]">Current Stock</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={newItem.current_stock}
                    onChange={(event) => setNewItem((previousState) => ({ ...previousState, current_stock: event.target.value }))}
                    className="mt-2 w-full rounded-2xl border border-[#2C2F45]/10 bg-white px-4 py-3 text-sm text-[#050725] outline-none focus:border-[#F9B672]"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#5F5F66]">Minimum Level</label>
                  <input
                    type="number"
                    placeholder="10"
                    value={newItem.min_level}
                    onChange={(event) => setNewItem((previousState) => ({ ...previousState, min_level: event.target.value }))}
                    className="mt-2 w-full rounded-2xl border border-[#2C2F45]/10 bg-white px-4 py-3 text-sm text-[#050725] outline-none focus:border-[#F9B672]"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-[#5F5F66]">Unit</label>
                <select
                  value={newItem.unit}
                  onChange={(event) => setNewItem((previousState) => ({ ...previousState, unit: event.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-[#2C2F45]/10 bg-white px-4 py-3 text-sm text-[#050725] outline-none focus:border-[#F9B672]"
                >
                  <option value="pcs">pcs</option>
                  <option value="kg">kg</option>
                  <option value="bottles">bottles</option>
                  <option value="packs">packs</option>
                  <option value="cans">cans</option>
                  <option value="boxes">boxes</option>
                  <option value="cartons">cartons</option>
                  <option value="liters">liters</option>
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddItem}
              disabled={!newItem.item_name.trim() || addLoading}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-[22px] bg-[#2C2F45] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#050725] disabled:opacity-50"
            >
              {addLoading ? (
                <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <Plus size={16} />
                  Add Item
                </>
              )}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default RestockPanel;
