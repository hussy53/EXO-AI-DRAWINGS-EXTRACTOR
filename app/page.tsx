"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Download, FileText, Layers3, LoaderCircle, MoreHorizontal, ScanLine, Upload, ZoomIn, ZoomOut } from "lucide-react";

type Item = { id:string; reference:string; type:string; width:string; height:string; quantity:string; glass:string; confidence:number; status:"review"|"approved" };
const initialItems: Item[] = [
  { id:"1", reference:"D-04", type:"Single glass door", width:"900", height:"2400", quantity:"3", glass:"12mm Clear Toughened", confidence:96, status:"approved" },
  { id:"2", reference:"D-05", type:"Double glass door", width:"1800", height:"2400", quantity:"1", glass:"12mm Clear Toughened", confidence:83, status:"review" },
  { id:"3", reference:"GW-02", type:"Fixed glass panel", width:"1250", height:"2700", quantity:"4", glass:"10mm Clear Toughened", confidence:72, status:"review" },
];

export default function Home() {
  const picker = useRef<HTMLInputElement>(null);
  const [fileName,setFileName] = useState("Marina Villa — Door Schedule.pdf");
  const [fileUrl,setFileUrl] = useState("");
  const [analyzing,setAnalyzing] = useState(false);
  const [message,setMessage] = useState("Demo drawing loaded — upload a PDF to extract its text.");
  const [items,setItems] = useState(initialItems);
  const [selected,setSelected] = useState("2");
  const selectedItem = useMemo(() => items.find((item)=>item.id===selected) ?? items[0],[items,selected]);
  useEffect(()=>{
    const context=(document as Document & {modelContext?:{registerTool:(tool:unknown,options?:{signal?:AbortSignal})=>void|Promise<void>}}).modelContext;
    if(!context?.registerTool) return;
    const lifecycle=new AbortController();
    void Promise.resolve(context.registerTool({name:"get_extraction_summary",title:"Read extraction summary",description:"Read the currently visible drawing extraction counts and review status.",inputSchema:{type:"object",properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:false},execute:()=>({fileName,total:items.length,approved:items.filter(i=>i.status==="approved").length,needsReview:items.filter(i=>i.status==="review").length})},{signal:lifecycle.signal})).catch(console.error);
    void Promise.resolve(context.registerTool({name:"approve_selected_drawing_item",title:"Approve selected item",description:"Approve the drawing item currently selected in the review panel after the user has verified it.",inputSchema:{type:"object",properties:{},additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:()=>{setItems((current)=>current.map((item)=>item.id===selected?{...item,status:"approved"}:item));return{reference:selectedItem?.reference??null,status:selectedItem?"approved":"no_selection"}}},{signal:lifecycle.signal})).catch(console.error);
    return()=>lifecycle.abort();
  },[fileName,items,selected,selectedItem]);
  function updateSelected(key:keyof Item,value:string){ setItems((current)=>current.map((item)=>item.id===selected?{...item,[key]:value}:item)); }
  useEffect(()=>()=>{ if(fileUrl) URL.revokeObjectURL(fileUrl); },[fileUrl]);
  async function chooseFile(file?:File){
    if(!file) return;
    if(fileUrl) URL.revokeObjectURL(fileUrl);
    setFileName(file.name); setFileUrl(URL.createObjectURL(file)); setAnalyzing(true); setMessage("Reading drawing text…");
    try{
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs",import.meta.url).toString();
      const pdf = await pdfjs.getDocument({data:await file.arrayBuffer()}).promise;
      const found:Item[]=[];
      for(let pageNumber=1;pageNumber<=pdf.numPages;pageNumber++){
        const page=await pdf.getPage(pageNumber); const content=await page.getTextContent();
        const drawingText=content.items.map((entry)=>"str" in entry?entry.str:"").join(" ").replace(/\s+/g," ");
        const row=/\b([A-Z]{1,3}[\s-]?\d{1,3})\b.{0,90}?(\d{3,4})\s*[x×X*]\s*(\d{3,4}).{0,45}?\b(?:QTY\s*)?(\d{1,2})\b/gi;
        let match:RegExpExecArray|null;
        while((match=row.exec(drawingText))!==null&&found.length<80){
          const context=drawingText.slice(match.index,match.index+220);
          const glass=context.match(/(\d{1,2}(?:\.\d+)?)\s*MM\s+([A-Z\s/-]{3,50}?)(?=\s{2,}|\b(?:QTY|NOS|NO\.|SIZE|WIDTH|HEIGHT)\b|$)/i);
          const ref=match[1].replace(/\s+/g,"-").toUpperCase();
          if(found.some((item)=>item.reference===ref&&item.width===match![2]&&item.height===match![3])) continue;
          found.push({id:`${pageNumber}-${found.length+1}`,reference:ref,type:/D(?:OOR)?-/i.test(ref)?"Glass door":"Glass panel",width:match[2],height:match[3],quantity:match[4],glass:glass?`${glass[1]}mm ${glass[2].trim().replace(/\s+/g," ")}`:"Specification needs review",confidence:glass?86:68,status:"review"});
        }
      }
      if(found.length){setItems(found);setSelected(found[0].id);setMessage(`${found.length} schedule row${found.length===1?"":"s"} detected. Review every value before export.`)}
      else{setItems([]);setMessage("No schedule rows matched automatically. The PDF is ready for visual review.")}
    }catch(error){console.error(error);setMessage("This PDF could not be read. It may be scanned or protected; scanned-page OCR is the next extraction layer.")}
    finally{setAnalyzing(false)}
  }
  function exportCsv(){
    const rows=[["Reference","Type","Width (mm)","Height (mm)","Quantity","Glass specification","Confidence","Status"],...items.map((i)=>[i.reference,i.type,i.width,i.height,i.quantity,i.glass,String(i.confidence),i.status])];
    const csv=rows.map((row)=>row.map((value)=>`"${String(value).replaceAll('"','""')}"`).join(",")).join("\r\n");
    const url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));const link=document.createElement("a");link.href=url;link.download=`${fileName.replace(/\.pdf$/i,"")}-extracted.csv`;link.click();URL.revokeObjectURL(url);
  }
  return <main className="app-shell">
    <input ref={picker} type="file" accept="application/pdf" hidden onChange={(event)=>chooseFile(event.target.files?.[0])}/>
    <header className="topbar">
      <div className="brand"><span className="brand-mark"><ScanLine size={22}/></span><span><strong>EXO</strong><small>DRAWINGS EXTRACTOR</small></span></div>
      <div className="project-switcher"><span className="status-dot"/> Marina Villa <ChevronDown size={15}/></div>
      <div className="top-actions"><button className="button ghost" onClick={()=>picker.current?.click()}><Upload size={17}/> {fileUrl?"Replace PDF":"Upload PDF"}</button><button className="button primary" onClick={exportCsv} disabled={!items.length}><Download size={17}/> Export CSV</button></div>
    </header>
    <section className="workspace-head"><div><p className="eyebrow">REVIEW WORKSPACE</p><h1>Door & glass schedule</h1><p className="analysis-message">{analyzing&&<LoaderCircle size={13} className="spin"/>}{message}</p></div><div className="progress-copy"><strong>{items.length} items found</strong><span>{items.filter(i=>i.status==="approved").length} approved · {items.filter(i=>i.status==="review").length} need review</span></div></section>
    <section className="workspace-grid">
      <aside className="pages-panel"><div className="panel-title"><span>Pages</span><span className="count">12</span></div>{[1,2,3,4].map((page)=><button key={page} className={`page-thumb ${page===3?"active":""}`}><span className="page-paper"><i/><i/><i/><b/></span><span>Page {page}<small>{page===3?"Door schedule":page===4?"Elevations":"General drawing"}</small></span></button>)}</aside>
      <section className="drawing-panel">
        <div className="drawing-toolbar"><span><FileText size={16}/> {fileName}</span><div><button aria-label="Zoom out"><ZoomOut size={17}/></button><strong>86%</strong><button aria-label="Zoom in"><ZoomIn size={17}/></button><button aria-label="More options"><MoreHorizontal size={18}/></button></div></div>
        <div className="drawing-stage">{fileUrl?<iframe className="pdf-frame" src={`${fileUrl}#page=1&view=FitH`} title="Uploaded drawing PDF"/>:<div className="drawing-sheet">
          <div className="sheet-title"><span>EXO GLASS & ALUMINIUM</span><strong>DOOR SCHEDULE</strong><small>DRAWING NO. A-501 · REV 02</small></div>
          <div className="technical-row"><div className="door-symbol"><span/><span/><i>D-04</i></div><div className="dimension horizontal">900</div><div className="dimension vertical">2400</div><div className="callout"><b>12MM CLEAR TOUGHENED GLASS</b><span>POLISHED EDGES</span><span>FLOOR SPRING + PATCH FITTINGS</span></div></div>
          <div className="schedule-table"><div className="table-head"><span>MARK</span><span>SIZE (MM)</span><span>QTY</span><span>DESCRIPTION</span></div><div><span>D-04</span><span>900 × 2400</span><span>3</span><span>12MM CLEAR TG</span></div><div className="highlight"><span>D-05</span><span>1800 × 2400</span><span>1</span><span>12MM CLEAR TG</span></div><div><span>GW-02</span><span>1250 × 2700</span><span>4</span><span>10MM CLEAR TG</span></div></div>
          <div className="source-tag"><ScanLine size={14}/> Selected source · D-05</div>
        </div>}</div>
      </section>
      <aside className="review-panel">
        <div className="panel-title"><span>Extracted items</span><span className="count">{items.length}</span></div>
        <div className="item-list">{items.map((item)=><button key={item.id} className={`item-row ${selected===item.id?"active":""}`} onClick={()=>setSelected(item.id)}><span className={`confidence ${item.confidence<80?"low":item.confidence<90?"medium":"high"}`}>{item.confidence}%</span><span><strong>{item.reference}</strong><small>{item.type}</small></span>{item.status==="approved"&&<Check size={16} className="approved-icon"/>}</button>)}</div>
        {selectedItem?<><div className="editor-head"><div><p className="eyebrow">ITEM DETAILS</p><h2>{selectedItem.reference}</h2></div><span className={selectedItem.status==="approved"?"approved-badge":"review-badge"}>{selectedItem.status==="approved"?"Approved":"Needs review"}</span></div>
        <div className="form-grid"><label className="full">Item type<input value={selectedItem.type} onChange={(e)=>updateSelected("type",e.target.value)}/></label><label>Width <span>mm</span><input value={selectedItem.width} onChange={(e)=>updateSelected("width",e.target.value)}/></label><label>Height <span>mm</span><input value={selectedItem.height} onChange={(e)=>updateSelected("height",e.target.value)}/></label><label>Quantity<input value={selectedItem.quantity} onChange={(e)=>updateSelected("quantity",e.target.value)}/></label><label className="full">Glass specification<input value={selectedItem.glass} onChange={(e)=>updateSelected("glass",e.target.value)}/></label></div>
        <div className="source-note"><Layers3 size={18}/><span><strong>Verify against the drawing</strong>Fields below 90% confidence should be checked before approval.</span></div>
        <button className="approve-button" onClick={()=>setItems((current)=>current.map((item)=>item.id===selected?{...item,status:"approved"}:item))}><Check size={18}/> Approve item</button></>:<div className="empty-state"><ScanLine size={30}/><strong>No automatic rows found</strong><span>Review the PDF visually. Scanned drawing OCR and manual row creation are planned for the next V1 slice.</span></div>}
      </aside>
    </section>
  </main>;
}
