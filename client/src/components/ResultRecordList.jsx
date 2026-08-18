// src/components/ResultRecordList.jsx
//
// Renders query results as expandable <details> rows, matching the
// original vanilla AI Query page. JSX escapes text content automatically,
// so no manual escapeHtml() is needed here.

export default function ResultRecordList({ records, hasSubmitted }) {
  const count = records.length;

  return (
    <>
      <div className="results-heading">
        Query Results ({count} Total)
      </div>

      {hasSubmitted && count === 0 && (
        <p className="empty-note">No records found for the generated query.</p>
      )}

      {count > 0 && (
        <ul className="result-list">
          {records.map((item, index) => {
            const preview =
              Object.values(item).find(
                (val) => typeof val === "string" && val.length > 0
              ) || "Details available below";

            return (
              <li key={index}>
                <details className="result-item">
                  <summary>
                    <span className="idx">Record #{index + 1}</span>
                    <span className="preview">{String(preview)}</span>
                  </summary>
                  <div className="detail-grid">
                    {Object.keys(item).map((key) => (
                      <div key={key}>
                        <strong>{key.replace(/_/g, " ")}</strong>: {String(item[key])}
                      </div>
                    ))}
                  </div>
                </details>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}