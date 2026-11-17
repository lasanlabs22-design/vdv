"use client";

export default function DarshanButton() {
  return <button className="darshan-replay" onClick={() => window.dispatchEvent(new Event("dv-replay"))}>Experience the blessing <span aria-hidden="true">↗</span></button>;
}
