export default function CustomToolTip ({active, payload, label}) {
    if (active && payload && payload.length) {
    return (
      <div className="p-4 bg-slate-900 flex flex-col gap-4 rounded-md">
        <p className="text-medium text-lg">{label}</p>
        <p className="text-sm text-blue-400">
          Revenue:
          <span className="ml-2">${payload[0].value}</span>
        </p>
        <p className="text-sm text-indigo-400">
          Profit:
          <span className="ml-2">${payload[1].value}</span>
        </p>
      </div>
    );
  } 
}