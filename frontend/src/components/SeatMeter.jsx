// Small bar showing how many seats are taken.
export default function SeatMeter({ taken, max }) {
  const percent = max > 0 ? Math.min(100, Math.round((taken / max) * 100)) : 0;
  const left = Math.max(max - taken, 0);
  return (
    <div className="seats" title={`${taken} of ${max} seats taken`}>
      <div className="seats-bar" aria-hidden="true">
        <span className={percent >= 100 ? "seats-fill seats-full" : "seats-fill"} style={{ width: `${percent}%` }} />
      </div>
      <small>{left === 0 ? "No seats left" : `${left} of ${max} seats left`}</small>
    </div>
  );
}
