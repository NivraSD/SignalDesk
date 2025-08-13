import React, { useState } from "react";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  PieChart,
  BarChart3,
  Plus,
} from "lucide-react";

export default function CampaignBudgetTracker({ budget = {}, items = [] }) {
  const [showAddItem, setShowAddItem] = useState(false);

  // Calculate budget metrics
  const totalBudget = budget.total || 100000;
  const totalAllocated =
    budget.totalAllocated ||
    Object.values(budget.allocation || {}).reduce((sum, val) => sum + val, 0);
  const totalSpent =
    budget.totalSpent ||
    items.reduce((sum, item) => sum + (item.spent || 0), 0);
  const remaining = totalBudget - totalSpent;
  const unallocated = totalBudget - totalAllocated;

  const allocations = budget.allocation || {
    "Media Relations": 30000,
    "Content Creation": 25000,
    "Paid Media": 20000,
    Events: 15000,
    "Tools & Software": 5000,
    Contingency: 5000,
  };

  // Calculate percentages
  const spentPercentage = (totalSpent / totalBudget) * 100;
  const allocatedPercentage = (totalAllocated / totalBudget) * 100;

  // Category colors
  const categoryColors = {
    "Media Relations": "#3b82f6",
    "Content Creation": "#8b5cf6",
    "Paid Media": "#ec4899",
    Events: "#f59e0b",
    "Tools & Software": "#10b981",
    Contingency: "#6b7280",
  };

  return (
    <div>
      <h3
        style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "1rem" }}
      >
        Budget Tracking
      </h3>

      {/* Budget Overview Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        <div
          style={{
            backgroundColor: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            padding: "1.5rem",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "0.5rem",
            }}
          >
            <DollarSign
              style={{ width: "20px", height: "20px", color: "#3b82f6" }}
            />
            <h4 style={{ fontSize: "0.875rem", color: "#6b7280", margin: 0 }}>
              Total Budget
            </h4>
          </div>
          <p style={{ fontSize: "2rem", fontWeight: "bold", margin: 0 }}>
            ${totalBudget.toLocaleString()}
          </p>
        </div>

        <div
          style={{
            backgroundColor: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            padding: "1.5rem",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "0.5rem",
            }}
          >
            <TrendingDown
              style={{ width: "20px", height: "20px", color: "#ef4444" }}
            />
            <h4 style={{ fontSize: "0.875rem", color: "#6b7280", margin: 0 }}>
              Spent
            </h4>
          </div>
          <p
            style={{
              fontSize: "2rem",
              fontWeight: "bold",
              margin: 0,
              color: "#ef4444",
            }}
          >
            ${totalSpent.toLocaleString()}
          </p>
          <p
            style={{
              fontSize: "0.75rem",
              color: "#6b7280",
              marginTop: "0.25rem",
            }}
          >
            {spentPercentage.toFixed(1)}% of budget
          </p>
        </div>

        <div
          style={{
            backgroundColor: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            padding: "1.5rem",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "0.5rem",
            }}
          >
            <TrendingUp
              style={{ width: "20px", height: "20px", color: "#10b981" }}
            />
            <h4 style={{ fontSize: "0.875rem", color: "#6b7280", margin: 0 }}>
              Remaining
            </h4>
          </div>
          <p
            style={{
              fontSize: "2rem",
              fontWeight: "bold",
              margin: 0,
              color: "#10b981",
            }}
          >
            ${remaining.toLocaleString()}
          </p>
          <p
            style={{
              fontSize: "0.75rem",
              color: "#6b7280",
              marginTop: "0.25rem",
            }}
          >
            {((remaining / totalBudget) * 100).toFixed(1)}% available
          </p>
        </div>

        <div
          style={{
            backgroundColor: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            padding: "1.5rem",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "0.5rem",
            }}
          >
            <AlertCircle
              style={{ width: "20px", height: "20px", color: "#f59e0b" }}
            />
            <h4 style={{ fontSize: "0.875rem", color: "#6b7280", margin: 0 }}>
              Unallocated
            </h4>
          </div>
          <p
            style={{
              fontSize: "2rem",
              fontWeight: "bold",
              margin: 0,
              color: "#f59e0b",
            }}
          >
            ${unallocated.toLocaleString()}
          </p>
          <p
            style={{
              fontSize: "0.75rem",
              color: "#6b7280",
              marginTop: "0.25rem",
            }}
          >
            {((unallocated / totalBudget) * 100).toFixed(1)}% unassigned
          </p>
        </div>
      </div>

      {/* Budget Progress Bar */}
      <div
        style={{
          backgroundColor: "white",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          padding: "1.5rem",
          marginBottom: "2rem",
        }}
      >
        <h4 style={{ fontWeight: "600", marginBottom: "1rem" }}>
          Budget Utilization
        </h4>
        <div style={{ marginBottom: "1rem" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "0.875rem",
              marginBottom: "0.5rem",
            }}
          >
            <span>Overall Progress</span>
            <span>{spentPercentage.toFixed(1)}% spent</span>
          </div>
          <div
            style={{
              width: "100%",
              height: "12px",
              backgroundColor: "#f3f4f6",
              borderRadius: "6px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${spentPercentage}%`,
                height: "100%",
                backgroundColor:
                  spentPercentage > 90
                    ? "#ef4444"
                    : spentPercentage > 70
                    ? "#f59e0b"
                    : "#10b981",
                transition: "width 0.3s",
              }}
            />
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "0.75rem",
            color: "#6b7280",
          }}
        >
          <span>$0</span>
          <span>${(totalBudget / 2).toLocaleString()}</span>
          <span>${totalBudget.toLocaleString()}</span>
        </div>
      </div>

      {/* Budget Allocation by Category */}
      <div
        style={{
          backgroundColor: "white",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          padding: "1.5rem",
          marginBottom: "2rem",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "1rem",
          }}
        >
          <h4 style={{ fontWeight: "600", margin: 0 }}>
            Budget Allocation by Category
          </h4>
          <PieChart
            style={{ width: "20px", height: "20px", color: "#6b7280" }}
          />
        </div>

        <div style={{ display: "grid", gap: "0.75rem" }}>
          {Object.entries(allocations).map(([category, amount]) => {
            const percentage = (amount / totalBudget) * 100;
            const spent = items
              .filter((item) => item.category === category)
              .reduce((sum, item) => sum + (item.spent || 0), 0);
            const categoryPercentageSpent =
              amount > 0 ? (spent / amount) * 100 : 0;

            return (
              <div
                key={category}
                style={{
                  backgroundColor: "#f9fafb",
                  borderRadius: "8px",
                  padding: "1rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "0.5rem",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <div
                      style={{
                        width: "12px",
                        height: "12px",
                        backgroundColor: categoryColors[category] || "#6b7280",
                        borderRadius: "2px",
                      }}
                    />
                    <span style={{ fontWeight: "500" }}>{category}</span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ margin: 0, fontWeight: "600" }}>
                      ${amount.toLocaleString()}
                    </p>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "0.75rem",
                        color: "#6b7280",
                      }}
                    >
                      {percentage.toFixed(1)}% of total
                    </p>
                  </div>
                </div>

                <div style={{ marginTop: "0.5rem" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "0.75rem",
                      marginBottom: "0.25rem",
                    }}
                  >
                    <span style={{ color: "#6b7280" }}>
                      ${spent.toLocaleString()} spent
                    </span>
                    <span style={{ color: "#6b7280" }}>
                      {categoryPercentageSpent.toFixed(1)}%
                    </span>
                  </div>
                  <div
                    style={{
                      width: "100%",
                      height: "4px",
                      backgroundColor: "#e5e7eb",
                      borderRadius: "2px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${categoryPercentageSpent}%`,
                        height: "100%",
                        backgroundColor: categoryColors[category] || "#6b7280",
                        transition: "width 0.3s",
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Expenses */}
      <div
        style={{
          backgroundColor: "white",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          padding: "1.5rem",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "1rem",
          }}
        >
          <h4 style={{ fontWeight: "600", margin: 0 }}>Recent Expenses</h4>
          <button
            onClick={() => setShowAddItem(!showAddItem)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.25rem",
              backgroundColor: "#2563eb",
              color: "white",
              padding: "0.5rem 1rem",
              borderRadius: "6px",
              border: "none",
              cursor: "pointer",
              fontSize: "0.875rem",
              fontWeight: "500",
            }}
          >
            <Plus style={{ width: "16px", height: "16px" }} />
            Add Expense
          </button>
        </div>

        {showAddItem && (
          <div
            style={{
              backgroundColor: "#f9fafb",
              padding: "1rem",
              borderRadius: "8px",
              marginBottom: "1rem",
            }}
          >
            <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>
              Add expense form would go here - connect to your expense tracking
              system
            </p>
          </div>
        )}

        {items.length === 0 ? (
          <p style={{ textAlign: "center", color: "#6b7280", padding: "2rem" }}>
            No expenses recorded yet
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", fontSize: "0.875rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <th
                    style={{
                      padding: "0.75rem",
                      textAlign: "left",
                      fontWeight: "600",
                    }}
                  >
                    Date
                  </th>
                  <th
                    style={{
                      padding: "0.75rem",
                      textAlign: "left",
                      fontWeight: "600",
                    }}
                  >
                    Description
                  </th>
                  <th
                    style={{
                      padding: "0.75rem",
                      textAlign: "left",
                      fontWeight: "600",
                    }}
                  >
                    Category
                  </th>
                  <th
                    style={{
                      padding: "0.75rem",
                      textAlign: "right",
                      fontWeight: "600",
                    }}
                  >
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.slice(0, 5).map((item, index) => (
                  <tr key={index} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "0.75rem" }}>
                      {new Date(item.date).toLocaleDateString()}
                    </td>
                    <td style={{ padding: "0.75rem" }}>{item.description}</td>
                    <td style={{ padding: "0.75rem" }}>
                      <span
                        style={{
                          padding: "0.25rem 0.75rem",
                          backgroundColor: "#f3f4f6",
                          borderRadius: "9999px",
                          fontSize: "0.75rem",
                        }}
                      >
                        {item.category}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "0.75rem",
                        textAlign: "right",
                        fontWeight: "500",
                      }}
                    >
                      ${item.spent.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {items.length > 5 && (
              <p
                style={{
                  textAlign: "center",
                  padding: "1rem",
                  fontSize: "0.875rem",
                  color: "#6b7280",
                }}
              >
                Showing 5 of {items.length} expenses
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
