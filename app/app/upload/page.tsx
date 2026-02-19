"use client"

import { useState } from "react"

export default function UploadPage() {
  const [response, setResponse] = useState<any>(null)

  async function testUpload() {
    const res = await fetch("/api/upload/invoices", {
      method: "POST"
    })
    const data = await res.json()
    setResponse(data)
  }

  return (
    <div style={{ padding: 40 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>
        Upload (Free Plan)
      </h1>

      <button
        onClick={testUpload}
        style={{
          marginTop: 20,
          padding: "12px 24px",
          background: "black",
          color: "white",
          borderRadius: 8
        }}
      >
        Test Upload
      </button>

      {response && (
        <pre style={{ marginTop: 20 }}>
          {JSON.stringify(response, null, 2)}
        </pre>
      )}
    </div>
  )
}
