import { useEffect, useState } from "react";

function App() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    fetch("http://localhost:8000/test")
      .then((res) => res.json())
      .then((data) => setCount(data.count));
  }, []);

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Theater DB Status</h1>
      <p style={{ fontSize: "24px" }}>
        Записей в базе данных: <b>{count}</b>
      </p>
      <button onClick={() => window.location.reload()}>
        Добавить запись (Обновить)
      </button>
    </div>
  );
}

export default App;
