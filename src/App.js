import React, { useState, useEffect } from "react"; 
import L from "leaflet";  // Leafletをインポート
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
//import "leaflet.markercluster/dist/MarkerCluster.css";
//import "leaflet.markercluster/dist/MarkerCluster.Default.css";
//import "leaflet.markercluster"; // leaflet.markerclusterをインポート

import "leaflet.markercluster/dist/leaflet.markercluster.css";
import "leaflet.markercluster/dist/leaflet.markercluster.js";
import { MarkerClusterGroup } from "react-leaflet";

import Modal from "react-modal";
import Papa from "papaparse";


// CSVファイルのパス
const csvFilePath = `${process.env.PUBLIC_URL}/csv/bread_data.csv`;
const historyCsvFilePath = `${process.env.PUBLIC_URL}/csv/history.csv`;
// const csvFilePath = "/csv/bread_data.csv";

const MapComponent = () => {
  const [breadData, setBreadData] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const [currentYearCategory, setCurrentYearCategory] = useState(-3300); // 初期年カテゴリ
  const [selectedData, setSelectedData] = useState(null); // パンまたは歴史データを選択


  // CSVファイルの読み込み(パンデータ)
  useEffect(() => {
    Papa.parse(csvFilePath, {
      download: true,
      header: true,
      complete: (result) => setBreadData(result.data),
    });
    // 歴史データの読み込み
    Papa.parse(historyCsvFilePath, {
      download: true,
      header: true,
      complete: (result) => setHistoryData(result.data),
    });
  }, []);

  // 年代を変更
  const handleYearChange = (step) => {
    setCurrentYearCategory((prev) => prev + step);
  };

  // 現在の年カテゴリに一致するパンデータ
  const filteredBreadData = breadData.filter(
    (bread) => parseInt(bread["年カテゴリ"]) === currentYearCategory
  );

  const filteredHistoryData = historyData.filter(
    (history) => parseInt(history["年カテゴリ"]) === currentYearCategory
  );

  const openModal = (data) => setSelectedData(data);
  const closeModal = () => setSelectedData(null);

  // 動的なカスタムアイコンを生成
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

  return (
    <div>
      <div style={{ marginBottom: "10px", textAlign: "center" }}>
        <button onClick={() => handleYearChange(-100)}>戻る</button>
        <span style={{ margin: "0 10px" }}>{`BCE ${Math.abs(currentYearCategory)}`}</span>
        <button onClick={() => handleYearChange(100)}>進む</button>
      </div>

      <MapContainer center={[20, 0]} zoom={2} style={{ height: "600px", width: "100%" ,zIndex: 1}}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
//        <div id="marker-cluster-group">
            <MarkerClusterGroup>
        {/* パンのデータマーカー */}
        {filteredBreadData.map((bread, index) => (
          <Marker
            key={index}
            position={[parseFloat(bread["緯度"]), parseFloat(bread["経度"])]}
            icon={createCustomIcon(bread["画像名"])}
            eventHandlers={{
              click: () => openModal(bread),
            }}
          >
            <Popup>{bread["パン名"]}</Popup>
          </Marker>
        ))}

                {/* 歴史データマーカー */}
                {filteredHistoryData.map((history, index) => (
          <Marker
            key={index}
            position={[parseFloat(history["緯度"]), parseFloat(history["経度"])]}
            icon={createCustomIconForHistory(history["年代"], history["タイトル"])}
            eventHandlers={{
              click: () => openModal(history),
            }}
          >
            <Popup>{history["タイトル"]}</Popup>
            </Marker>
        ))}
//        </div>
          </MarkerClusterGroup>
      </MapContainer>

      {/* モーダル */}
      {selectedData && (
        <Modal isOpen={true} onRequestClose={closeModal} ariaHideApp={false} style={{
          overlay: { zIndex: 9999 },
          content: { zIndex: 9999, width: '80%', maxWidth: '600px', margin: 'auto', padding: '20px', backgroundColor: 'white', borderRadius: '10px' },
        }}>
          {selectedData["パン名"] ? (
            <div>
              <h2>{selectedData["パン名"]}</h2>
              <p><strong>発祥地:</strong> {selectedData["発祥地"]}</p>
              <p><strong>発祥年:</strong> {selectedData["発祥年"]}</p>
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
      )}
    </div>
  );
};

export default MapComponent;
