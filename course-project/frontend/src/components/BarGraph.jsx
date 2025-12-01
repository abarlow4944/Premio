import {
    BarChart,
    Bar,
    ResponsiveContainer,
    Legend,
    Tooltip,
    XAxis,
    YAxis,
    CartesianGrid,
} from "recharts";

export default function BarGraph({ data, xAxis, yAxis, name, ...rest }) {
    return (
        <div className="w-full h-full bg-white p-4 rounded-xl shadow">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={data}
                    margin={{ right: 30 }}
                >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey={xAxis} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar type="monotone" name={name} dataKey={yAxis} fill="#ef4444" radius={[8, 8, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
