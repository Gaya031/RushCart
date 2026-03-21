import React, { useMemo, useState } from "react";

const toDateKey = (date) => date.toISOString().slice(0, 10);

const formatDateLabel = (date) =>
  date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });

const buildSlots = () => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const windows = [
    "09:00-11:00",
    "11:00-13:00",
    "16:00-18:00",
    "18:00-20:00",
  ];

  const slots = [];
  for (const day of [today, tomorrow]) {
    for (const window of windows) {
      slots.push({
        value: `${toDateKey(day)}|${window}`,
        label: `${formatDateLabel(day)} - ${window.replace("-", " to ")}`,
      });
    }
  }
  return slots;
};

const DeliverySchedule = ({ onModeChange, onSlotChange }) => {
  const [mode, setMode] = useState("instant");
  const [slot, setSlot] = useState("");
  const slots = useMemo(() => buildSlots(), []);

  const chooseMode = (nextMode) => {
    setMode(nextMode);
    onModeChange?.(nextMode);
    if (nextMode === "instant") {
      setSlot("");
      onSlotChange?.(null);
      return;
    }
    const initialSlot = slot || slots[0]?.value || "";
    setSlot(initialSlot);
    onSlotChange?.(initialSlot || null);
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <h2 className="font-semibold text-white mb-4">2. Delivery Schedule</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          onClick={() => chooseMode("instant")}
          className={`border p-4 rounded-xl cursor-pointer transition ${
            mode === "instant"
              ? "border-amber-300/60 bg-amber-300/10 text-white"
              : "border-white/10 text-white/70 hover:bg-white/5"
          }`}
        >
          <b>Instant Delivery</b>
          <p className="text-sm">Within 30-45 mins</p>
        </div>

        <div
          onClick={() => chooseMode("scheduled")}
          className={`border p-4 rounded-xl cursor-pointer transition ${
            mode === "scheduled"
              ? "border-amber-300/60 bg-amber-300/10 text-white"
              : "border-white/10 text-white/70 hover:bg-white/5"
          }`}
        >
          <b>Scheduled</b>
          <p className="text-sm">Choose a time slot</p>
        </div>
      </div>

      {mode === "scheduled" && (
        <div className="mt-4">
          <label className="block text-sm font-medium text-white/70 mb-2">Select delivery time slot</label>
          <select
            value={slot}
            onChange={(e) => {
              const nextSlot = e.target.value;
              setSlot(nextSlot);
              onSlotChange?.(nextSlot || null);
            }}
            className="w-full border border-white/10 rounded-xl px-3 py-2 bg-white/5 text-white"
          >
            {slots.map((entry) => (
              <option key={entry.value} value={entry.value}>
                {entry.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};

export default DeliverySchedule;
