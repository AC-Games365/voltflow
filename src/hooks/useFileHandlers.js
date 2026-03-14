import { useCallback, useState } from 'react';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

export const useFileHandlers = ({ 
  nodes, edges, levels, activeLevelId, projectData, 
  setNodes, setEdges, setProjectData, setActiveLevelId,
  takeSnapshot, reactFlowWrapper, texts, lang 
}) => {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

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
    localStorage.setItem('voltflow-plan', JSON.stringify({ levels, activeLevelId, projectData }));
    alert(texts.plan_saved);
  }, [levels, activeLevelId, projectData, texts]);

  const onClear = useCallback(() => {
    if (window.confirm(texts.confirm_clear)) {
      takeSnapshot();
      setNodes([]);
      setEdges([]);
      setProjectData(pd => ({...pd, projectName: '', clientName: '', clientAddress: '', installerName: ''}));
      localStorage.removeItem('voltflow-plan');
    }
  }, [setNodes, setEdges, setProjectData, texts, takeSnapshot]);

  const onExportJSON = useCallback(() => {
    const dataStr = JSON.stringify({ levels, activeLevelId, projectData }, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `${projectData.projectName || 'voltflow_projet'}.json`);
    a.click();
    URL.revokeObjectURL(url);
  }, [levels, activeLevelId, projectData]);

  const onImportJSON = useCallback((event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (parsed.levels) {
          takeSnapshot();
          setProjectData(parsed.projectData);
          // On force la mise à jour de l'état global via setState de useUndoRedo si besoin, 
          // mais ici on suppose que les setters individuels suffisent.
          // Note: Pour un import JSON complet, il vaut mieux passer par un setter global.
        }
      } catch (err) { alert(lang === 'fr' ? "Erreur de lecture." : "Read error."); }
    };
    reader.readAsText(file);
  }, [setProjectData, takeSnapshot, lang]);

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

  // --- LOGIQUE EXPORT PDF ---
  const onExportPDF = useCallback(async (uNodes, uEdges, materialCounts) => {
    if (!reactFlowWrapper.current) return;
    setIsGeneratingPDF(true);

    try {
      const pdf = new jsPDF('l', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // 1. PAGE DE GARDE
      pdf.setFontSize(24);
      pdf.text("DOSSIER TECHNIQUE ÉLECTRIQUE", pageWidth / 2, 40, { align: 'center' });
      pdf.setFontSize(18);
      pdf.text(projectData.projectName || "PROJET SANS NOM", pageWidth / 2, 60, { align: 'center' });
      
      pdf.setFontSize(12);
      pdf.text(`Client : ${projectData.clientName || '...' }`, 40, 100);
      pdf.text(`Adresse : ${projectData.clientAddress || '...' }`, 40, 110);
      pdf.text(`Installateur : ${projectData.installerName || '...' }`, 40, 120);
      pdf.text(`Date : ${new Date(projectData.date).toLocaleDateString()}`, 40, 130);

      // 2. PLANS PAR ÉTAGE
      // On sauvegarde l'ID du niveau actuel pour y revenir à la fin
      const originalLevelId = activeLevelId;

      for (const level of levels) {
        // On change de niveau pour la capture
        setActiveLevelId(level.id);
        // On attend un court instant que ReactFlow se mette à jour visuellement
        await new Promise(resolve => setTimeout(resolve, 500));

        const dataUrl = await toPng(reactFlowWrapper.current, { 
          backgroundColor: '#ffffff',
          filter: (node) => !node?.classList?.contains('react-flow__controls') && !node?.classList?.contains('no-print'),
        });

        pdf.addPage();
        pdf.setFontSize(16);
        pdf.text(`PLAN : ${level.name.toUpperCase()}`, 10, 15);
        pdf.addImage(dataUrl, 'PNG', 10, 20, pageWidth - 20, pageHeight - 30);
      }

      // 3. NOMENCLATURE
      pdf.addPage();
      pdf.setFontSize(16);
      pdf.text("LISTE DU MATÉRIEL", 10, 15);
      let y = 30;
      pdf.setFontSize(12);
      Object.entries(materialCounts).forEach(([type, count]) => {
        pdf.text(`${texts[type] || type}`, 20, y);
        pdf.text(`x${count}`, pageWidth - 40, y, { align: 'right' });
        y += 10;
        if (y > pageHeight - 20) { pdf.addPage(); y = 20; }
      });

      // Rétablir le niveau original
      setActiveLevelId(originalLevelId);
      pdf.save(`dossier_${projectData.projectName || 'projet'}.pdf`);

    } catch (error) {
      console.error("Erreur PDF:", error);
      alert("Une erreur est survenue lors de la génération du PDF.");
    } finally {
      setIsGeneratingPDF(false);
    }
  }, [reactFlowWrapper, projectData, levels, activeLevelId, setActiveLevelId, texts]);

  return { onExportImage, onSave, onClear, onExportJSON, onImportJSON, exportToCSV, onExportPDF, isGeneratingPDF };
};