import React from "react";

type KpiCardProps = {
  title: string;
  value: string | number;
  delta?: string;
};

export function KpiCard({ title, value, delta }: KpiCardProps) {
  return (
    <section className="kpi-card">
      <div className="kpi-card__title">{title}</div>
      <div className="kpi-card__value">{value}</div>
      {delta ? <div className="kpi-card__delta">{delta}</div> : null}
    </section>
  );
}
