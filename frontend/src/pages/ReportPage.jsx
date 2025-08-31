import React, { useEffect, useState } from "react";
import axios from "../services/api";
import "../styles/ReportPage.css";
import { Pie, Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Title,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
} from "chart.js";

ChartJS.register(
  ArcElement, Tooltip, Legend, Title,
  CategoryScale, LinearScale, BarElement,
  PointElement, LineElement
);

export default function ReportPage({ user }) {

  const [stats, setStats] = useState({});
  const [tasksByProject, setTasksByProject] = useState([]);
  const [completionTrend, setCompletionTrend] = useState([]);

  useEffect(() => {
    axios.get("/reports/overview").then(res => setStats(res.data));
    axios.get("/reports/tasks-by-project").then(res => setTasksByProject(res.data));
    axios.get("/reports/completion-trend").then(res => setCompletionTrend(res.data));
  }, []);

  return (
    <div className="report-page">
      <h2>📈 Báo cáo & Thống kê</h2>

      {/* Cards */}
      <div className="report-cards">
        <div className="card">Tổng dự án: {stats.totalProjects}</div>
        <div className="card">Đang hoạt động: {stats.activeProjects}</div>
        <div className="card">Đã lưu trữ: {stats.archivedProjects}</div>
        <div className="card">Tổng công việc: {stats.totalTasks}</div>
        <div className="card">Hoàn thành: {stats.completedTasks}</div>
      </div>

      {/* Charts */}
      <div className="charts">
        <div className="chart-box">
          <h3>Tỷ lệ trạng thái công việc</h3>
          <Pie
            data={{
              labels: ["Chưa làm", "Đang làm", "Hoàn thành"],
              datasets: [
                {
                  data: [
                    stats.openTasks || 0,
                    stats.inProgressTasks || 0,
                    stats.completedTasks || 0,
                  ],
                  backgroundColor: ["#ef476f", "#ffd166", "#06d6a0"],
                },
              ],
            }}
          />
        </div>

        <div className="chart-box">
          <h3>Công việc theo dự án</h3>
          <Bar
            data={{
              labels: tasksByProject.map((p) => p.project_name),
              datasets: [
                {
                  label: "Số công việc",
                  data: tasksByProject.map((p) => p.task_count),
                  backgroundColor: "#4b82f1",
                },
              ],
            }}
          />
        </div>

        <div className="chart-box">
          <h3>Tiến độ hoàn thành theo thời gian</h3>
          <Line
            data={{
              labels: completionTrend.map((d) => d.date),
              datasets: [
                {
                  label: "Số công việc hoàn thành",
                  data: completionTrend.map((d) => d.completed_count),
                  borderColor: "#06d6a0",
                  backgroundColor: "#06d6a055",
                },
              ],
            }}
          />
        </div>
      </div>
    </div>
  );
}
