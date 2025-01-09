import React, { useState, useEffect, useRef } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import MarkerClusterGroup from "react-leaflet-cluster";
import Modal from "react-modal";
import Papa from "papaparse";
import { useMediaQuery } from "react-responsive";
// CSVファイルのパス
const csvFilePath = `${process.env.PUBLIC_URL}/csv/bread_data.csv`;
const historyCsvFilePath = `${process.env.PUBLIC_URL}/csv/history.csv`;

const MapComponent = () => {
  const [breadData, setBreadData] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const [currentYearCategory, setCurrentYearCategory] = useState(-3300);
  const [selectedData, setSelectedData] = useState(null);
  const mapRef = useRef(null);

  const isMobile = useMediaQuery({ query: "(max-width: 768px)" });

  useEffect(() => {
    Papa.parse(csvFilePath, {
      download: true,
      header: true,
      complete: (result) => setBreadData(result.data),
    });
    Papa.parse(historyCsvFilePath, {
      download: true,
      header: true,
      complete: (result) => setHistoryData(result.data),
    });
  }, []);

  const filteredBreadData = breadData.filter(
    (bread) => parseInt(bread["年カテゴリ"]) === currentYearCategory
  );

  const filteredHistoryData = historyData.filter(
    (history) => parseInt(history["年カテゴリ"]) === currentYearCategory
  );

  const createCustomIcon = (imageName) => {
    return L.divIcon({
      className: "custom-icon",
      html: `<div style="width:50px; height:50px; border:2px solid gold; border-radius:50%; overflow:hidden; display:flex; justify-content:center; align-items:center;">
      <img src="${process.env.PUBLIC_URL}/images/${imageName}" alt="icon" style="width:100%; height:100%; object-fit:cover;" />
    </div>`,
      iconSize: [50, 50],
      iconAnchor: [25, 25],
    });
  };

  const openModal = (data) => setSelectedData(data);
  const closeModal = () => setSelectedData(null);

  // 歴史用のアイコンを生成（歴史データ）
  const createCustomIconForHistory = (year, title) => {
    return L.divIcon({
      className: "custom-icon",
      html: `<div style="width:80px; height:80px; border:2px solid gold; border-radius:10px; overflow:hidden; display:flex; justify-content:center; align-items:center; text-align:center;">
        <div style="padding: 5px;">
          <span style="font-size: 10px; font-weight: bold;">${year}</span>
          <br />
          <span style="font-size: 12px;">${title}</span>
        </div>
      </div>`,
      iconSize: [80, 60],
      iconAnchor: [40, 40],
    });
  };

  const focusOnMarker = (lat, lng) => {
    if (mapRef.current) {
      const map = mapRef.current;
      map.flyTo([lat, lng], 8, { duration: 1.5 }); // マーカーにズームイン
    }
  };

  return (
    <div style={{
      fontFamily: "'Noto Sans JP', sans-serif",
    }}
    >
      <header style={{ backgroundColor: "#282c34", color: "white",textAlign: "center"}}>
        <h1>パンの歴史マップ</h1>
      </header>

      <div style={{ display: isMobile ? "block" : "flex", padding: "10px"}}>
        <div style={{ flex: 3, marginBottom: isMobile ? "20px" : "0",textAlign: "center"}}>
          <button
            onClick={() => {
              setCurrentYearCategory((prev) => {
                const newYear = prev - 100;
                return newYear === 0 ? -100 : newYear; // 0年をスキップ
              });
            }}
          >
            戻る
          </button>

          <span style={{ margin: "0 10px" }}>
            {currentYearCategory < 0
              ? `BCE ${Math.abs(currentYearCategory)}`
              : `CE ${currentYearCategory}`}
          </span>

          <button
            onClick={() => {
              setCurrentYearCategory((prev) => {
                const newYear = prev + 100;
                return newYear === 0 ? 100 : newYear; // 0年をスキップ
              });
            }}
          >
            進む
          </button>

          <button
            onClick={() => {
              if (mapRef.current) {
                mapRef.current.setView([20, 0], 2); // 初期中心座標とズームレベルに戻す
              }
            }}
            style={{ marginLeft: "10px" }}
          >
            全体
          </button>

          <MapContainer center={[20, 0]} zoom={2} style={{ height: "600px", width: "100%", zIndex: 1 }} ref={mapRef}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <MarkerClusterGroup>
              {filteredBreadData.map((bread, index) => (
                <Marker
                  key={index}
                  position={[parseFloat(bread["緯度"]), parseFloat(bread["経度"])]}
                  icon={createCustomIcon(bread["画像名"])}
                  eventHandlers={{ click: () => openModal(bread) }}
                >
                  <Popup>{bread["パン名"]}</Popup>
                </Marker>
              ))}

              {filteredHistoryData.map((history, index) => (
                <Marker
                  key={index}
                  position={[parseFloat(history["緯度"]), parseFloat(history["経度"])]}
                  icon={createCustomIconForHistory(history["年代"], history["タイトル"])}
                  eventHandlers={{ click: () => openModal(history) }}
                >
                  <Popup>{history["タイトル"]}</Popup>
                </Marker>
              ))}
            </MarkerClusterGroup>
          </MapContainer>
        </div>

        <div style={{ flex: 1, borderLeft: "1px solid #ccc", padding: "10px", height: "600px", overflowY: "scroll" }}>
          <h3>アイコン一覧</h3>
          {filteredBreadData.map((bread, index) => (
            <div key={index} style={{ marginBottom: "10px" }}>
              <span
                onClick={() => focusOnMarker(parseFloat(bread["緯度"]), parseFloat(bread["経度"]))}
                style={{ cursor: "pointer", color: "blue", textDecoration: "underline" }}
              >
                {bread["発祥年"]} - {bread["パン名"]}
              </span>
              {" "}
              <span
                onClick={() => openModal(bread)}
                style={{ cursor: "pointer", color: "blue", textDecoration: "underline" }}
              >
                [ i ]
              </span>
            </div>
          ))}
          {filteredHistoryData.map((history, index) => (
            <div key={index} style={{ marginBottom: "10px" }}>
              <span
                onClick={() => focusOnMarker(parseFloat(history["緯度"]), parseFloat(history["経度"]))}
                style={{ cursor: "pointer", color: "blue", textDecoration: "underline" }}
              >
                {history["年代"]} - {history["タイトル"]}
              </span>
              {" "}
              <span
                onClick={() => openModal(history)}
                style={{ cursor: "pointer", color: "blue", textDecoration: "underline" }}
              >
                [ i ]
              </span>
            </div>
          ))}
        </div>
      </div>

      {selectedData && (
        <Modal isOpen={true} onRequestClose={closeModal} ariaHideApp={false} style={{
          overlay: { zIndex: 9999 },
          content: { zIndex: 9999, width: '80%', maxWidth: '600px', margin: 'auto', padding: '20px', backgroundColor: 'white', borderRadius: '10px' },
        }}>
          {selectedData["パン名"] ? (
            <div>
              <h2>{selectedData["パン名"]}</h2>
              <p><strong>発祥地:</strong> {selectedData["発祥地"]}</p>
              <p>{selectedData["説明"]}</p>
              <img src={`${process.env.PUBLIC_URL}/images/${selectedData["画像名"]}`} alt={selectedData["パン名"]} style={{ width: "100%" }} />
            </div>
          ) : (
            <div>
              <h2>{selectedData["年代"]} - {selectedData["タイトル"]}</h2>
              <p><strong>説明:</strong> {selectedData["説明"]}</p>
              {selectedData["画像"] !== 'none' ? (
                <img src={`${process.env.PUBLIC_URL}/images/${selectedData["画像"]}`} alt={selectedData["タイトル"]} style={{ width: "100%", height: "auto", objectFit: "contain" }} />
              ) : (
                <p>画像はありません。</p>
              )}
            </div>
          )}
          <button onClick={closeModal}>閉じる</button>
        </Modal>
      )
      }
    </div >

  );
};

export default MapComponent;
