import { useCallback } from 'react';
import { toPng } from 'html-to-image';

export const useFileHandlers = ({ nodes, edges, projectData, setNodes, setEdges, setProjectData, takeSnapshot, reactFlowWrapper, texts, lang }) => {

  const onExportImage = useCallback(() => {
    if (reactFlowWrapper.current === null) return;
    
    toPng(reactFlowWrapper.current, { 
      backgroundColor: projectData.canvasBgColor || '#f0f0f0',
      filter: (node) => !node?.classList?.contains('react-flow__controls'),
    }).then((dataUrl) => {
        const a = document.createElement('a');
        a.setAttribute('download', 'plan-electrique.png');
        a.setAttribute('href', dataUrl);
        a.click();
      }).catch((err) => console.error("Erreur lors de l'exportation", err));
  }, [projectData.canvasBgColor, reactFlowWrapper]);

  const onSave = useCallback(() => {
    localStorage.setItem('voltflow-plan', JSON.stringify({ nodes, edges, projectData }));
    alert(texts.plan_saved);
  }, [nodes, edges, projectData, texts]);

  const onClear = useCallback(() => {
    if (window.confirm(texts.confirm_clear)) {
      takeSnapshot();
      setNodes([]);
      setEdges([]);
      setProjectData(projectData => ({...projectData, projectName: '', clientName: '', clientAddress: '', installerName: ''}));
      localStorage.removeItem('voltflow-plan');
    }
  }, [setNodes, setEdges, setProjectData, texts, takeSnapshot]);

  const onExportJSON = useCallback(() => {
    const dataStr = JSON.stringify({ nodes, edges, projectData }, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `${projectData.projectName || 'voltflow_projet'}.json`);
    a.click();
    URL.revokeObjectURL(url);
  }, [nodes, edges, projectData]);

  const onImportJSON = useCallback((event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (parsed.nodes && parsed.edges) {
          takeSnapshot();
          setNodes(parsed.nodes);
          setEdges(parsed.edges);
          if (parsed.projectData) setProjectData(parsed.projectData);
        } else {
          alert(lang === 'fr' ? "Fichier JSON invalide." : "Invalid JSON file.");
        }
      } catch (err) {
        alert(lang === 'fr' ? "Erreur de lecture du fichier." : "Error reading file.");
      }
    };
    reader.readAsText(file);
    event.target.value = null;
  }, [setNodes, setEdges, setProjectData, takeSnapshot, lang]);

  const exportToCSV = useCallback((materialCounts) => {
    if (Object.keys(materialCounts).length === 0) return;
    
    let csvContent = lang === 'fr' ? "Composant,Quantité\n" : "Component,Quantity\n";
    Object.entries(materialCounts).forEach(([type, count]) => {
      csvContent += `"${texts[type]}",${count}\n`;
    });
    
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `nomenclature_${projectData.projectName || 'projet'}.csv`);
    a.click();
    URL.revokeObjectURL(url);
  }, [texts, lang, projectData.projectName]);

  return { onExportImage, onSave, onClear, onExportJSON, onImportJSON, exportToCSV };
};