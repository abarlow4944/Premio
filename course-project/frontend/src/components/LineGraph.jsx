import {
    LineChart,
    ResponsiveContainer,
    Legend,
    Tooltip,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
} from "recharts";

export default function LineGraph({ data, xAxis, yAxis, xAxisName, yAxisName }) {
    console.log(data)
    return (
        <div className="w-[60vw] h-[60vh] bg-white p-4 rounded-xl shadow">
            <ResponsiveContainer width="100%" height="100%">
            <LineChart
                data={data}
                margin={{ right: 30 }}
            >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xAxis}/>
            <YAxis dataKey={yAxis}/>
            <Tooltip />
            <Legend />
            <Line type="monotone" name={xAxisName}dataKey={xAxis} stroke="#ef4444" strokeWidth={3} activeDot={{ r: 8 }}/>
            <Line type="monotone" name={yAxisName}dataKey={yAxis} stroke="#ef4444" strokeWidth={3} activeDot={{ r: 8 }}/>
            </LineChart>
        </ResponsiveContainer>
    </div>
  );
}
