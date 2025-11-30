import CustumToolTip from "./CustumToolTip";
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

export default function LineGraph () {
    return (
        <ResponsiveContainer width="100%" height="100%">
        <LineChart
            width={500}
            height={300}
            data={}
            margin={{
            right: 30,
            }}
        >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line type="monotone" dataKey="revenue" stroke="#3b82f6" />
            <Line type="monotone" dataKey="profit" stroke="#8b5cf6" />
        </LineChart>
        </ResponsiveContainer>
    );
};