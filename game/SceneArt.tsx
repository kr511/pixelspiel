import { memo } from "react";
import type { Place } from "./story";

function Tree({ x, y }: { x: number; y: number }) {
  return <g transform={`translate(${x} ${y})`}><path d="M-4 0h8v-32h-8" fill="#775038"/><path d="M-25-24h50v-16h-7v-16H8v-8H-9v8h-12v16h-4Z" fill="#315d48"/><path d="M-18-43h30v-10H2v-5H-7v8h-11Z" fill="#568564"/><path d="M-24-22h48v5h-48Z" fill="#254c3c"/></g>;
}
function Window({ x, y }: { x: number; y: number }) {
  return <g transform={`translate(${x} ${y})`}><rect width="48" height="48" fill="#684c43"/><rect x="4" y="4" width="40" height="38" fill="#b4d5ca"/><path d="M24 4v38M4 24h40" stroke="#fff1cf" strokeWidth="3"/><path d="M-5 46h58v7H-5Z" fill="#8b6450"/></g>;
}
export const SceneArt = memo(function SceneArt({ place, christmas }: { place: Place; christmas: boolean }) {
  if (place === "bedroom") return null;
  const outdoors = ["garden", "bus", "school", "radegast", "zoerbig","schoolway", "goelzau"].includes(place);
  return <svg className="scene-art" viewBox="0 0 600 600" aria-hidden="true" shapeRendering="crispEdges">
    <defs><pattern id="grass" width="36" height="36" patternUnits="userSpaceOnUse"><rect width="36" height="36" fill={christmas ? "#cad5c4" : "#8ca779"}/><path d="M7 11h3v3H7M23 25h5v2h-5" fill={christmas ? "#e3e8d8" : "#779466"}/></pattern><pattern id="floor" width="90" height="30" patternUnits="userSpaceOnUse"><rect width="90" height="30" fill="#b68a64"/><path d="M0 29h90M1 0v30M45 0v5M18 12h32" stroke="#9c7556" strokeWidth="2"/></pattern><pattern id="paving" width="36" height="24" patternUnits="userSpaceOnUse"><rect width="36" height="24" fill="#c6bda1"/><path d="M0 23h36M0 0v24" stroke="#afa88f"/></pattern></defs>
    <rect width="600" height="600" fill={outdoors ? "url(#grass)" : "url(#floor)"}/>
    {place === "radegast" && <>
      <path d="M250 50L264 210 318 330 408 570" fill="none" stroke="#d9ccb1" strokeWidth="110"/><path d="M250 50L264 210 318 330 408 570" fill="none" stroke="#787c77" strokeWidth="62"/>
      {[[25,40,150,85],[30,220,145,100],[30,400,200,160],[385,30,180,210],[455,320,145,220]].map(([x,y,w,h])=><g key={`${x}-${y}`}><rect x={x} y={y} width={w} height={h} fill="#b79d7c"/><path d={`M${x-4} ${y}h${w+8}v${h-12}h-${w+8}Z`} fill="#736e60"/><path d={`M${x+w/2} ${y}v${h-12}`} stroke="#a4937e" strokeWidth="4"/></g>)}
    </>}
    {place === "gym" && <><rect width="600" height="600" fill="url(#floor)"/><rect width="600" height="90" fill="#ead5ad"/><path d="M60 150H540V540H60Z" fill="none" stroke="#f1e3c3" strokeWidth="4"/><circle cx="300" cy="330" r="65" fill="none" stroke="#f1e3c3" strokeWidth="4"/><rect x="216" y="108" width="174" height="42" fill="#9c7152"/>{[240,280,320].map(x=><rect key={x} x={x} y="112" width="25" height="16" fill="#f5e6c6"/>)}<Window x={50} y={20}/><Window x={500} y={20}/></>}
    {place === "zoerbig" && <><rect x="135" y="100" width="320" height="365" fill="url(#paving)"/><rect x="20" y="35" width="130" height="160" fill="#cfbc96"/><text x="30" y="100" fontSize="15" fill="#873b34">Löwen-Apotheke</text><rect x="460" y="80" width="130" height="320" fill="#a05f45"/><path d="M285 130h20l10 100h-40Z" fill="#b29d76"/><ellipse cx="300" cy="385" rx="55" ry="25" fill="#90aaa0"/><Tree x={190} y={340}/><Tree x={410} y={360}/></>}
    {place === "schoolway" && <>
      <path d="M170 60H435V215H170ZM275 190L240 252 180 345 120 420 90 510" fill="none" stroke="#d6c7a9" strokeWidth="75"/>
      <rect x="12" y="12" width="120" height="190" fill="#96795f"/><rect x="465" y="12" width="125" height="190" fill="#96795f"/>
      <rect x="392" y="285" width="130" height="103" fill="#b2a182"/><rect x="431" y="230" width="44" height="74" fill="#716b60"/>
      <rect x="155" y="475" width="230" height="115" fill="#8b6c51"/><rect x="160" y="470" width="220" height="94" fill="#6c6960"/>
    </>}
    {place === "goelzau" && <>
      <path d="M150 180V250L390 390 600 450" fill="none" stroke="#d3bfa0" strokeWidth="85"/><rect x="35" y="20" width="330" height="140" fill="#aa9576"/><rect x="25" y="15" width="350" height="130" fill="#766f61"/><rect x="132" y="128" width="38" height="38" fill="#5e6859"/>
      <Tree x={520} y={220}/><Tree x={74} y={415}/><Tree x={285} y={565}/>
    </>}
    {place === "garden" && <>
      <path d="M274 123h52v470h-52M298 391h302v55H298" fill="#cbb18a"/><path d="M278 132h44v450h-44M310 397h290v42H310" fill="#ddc399"/>
      <rect x="158" y="30" width="274" height="96" fill="#e5c49c"/><path d="M143 35V17h302v18Z" fill="#754b47"/><path d="M150 37h288v12H150" fill="#ab6d55"/><rect x="277" y="67" width="46" height="60" fill="#765345"/><rect x="286" y="73" width="27" height="24" fill="#dfbc7f"/><Window x={184} y={61}/><Window x={351} y={61}/>
      <Tree x={81} y={235}/><Tree x={490} y={228}/><Tree x={69} y={529}/><Tree x={506} y={538}/>
      <path d="M36 560h530M36 566h530" stroke="#deceb0" strokeWidth="5"/>{[40,100,160,220,380,440,500,560].map(x=><rect key={x} x={x} y="548" width="7" height="28" fill="#ecdbb9"/>)}
      {[{x:125,y:304},{x:460,y:292},{x:421,y:483}].map(p=><g key={p.x} transform={`translate(${p.x} ${p.y})`}><path d="M0 0v14M18 3v13M-14 5v11" stroke="#527b4d" strokeWidth="3"/><path d="M-5-4h10v8H-5M13-1h10v8H13M-19 1h10v8h-10" fill={christmas ? "#d9ece3" : "#f1d892"}/></g>)}
    </>}
    {(place === "home" || place === "kitchen") && <>
      <rect width="600" height="91" fill="#d5b18d"/><path d="M0 88h600" stroke="#735343" strokeWidth="9"/><Window x={111} y={23}/><Window x={341} y={23}/>
      <rect x="211" y="196" width="202" height="199" fill="#a36e67"/><path d="M220 204h184v182H220Z" fill="none" stroke="#d7af88" strokeWidth="4"/>
      <rect x="222" y="221" width="173" height="118" fill="#684a3b"/><rect x="225" y="216" width="168" height="108" fill="#cfaa7a"/><rect x="245" y="216" width="34" height="108" fill="#ece0bf"/>
      {[244,365].flatMap(x=>[231,256,281,306].map(y=><g key={`${x}-${y}`}><circle cx={x} cy={y} r="10" fill="#f5ead1"/><circle cx={x} cy={y} r="7" fill="#e2d1b4"/></g>))}
      <rect x="77" y="114" width="108" height="87" fill="#5a6e63"/><rect x="86" y="120" width="90" height="52" fill="#8ba187"/><path d="M86 178h90M130 121v49" stroke="#c0c5a2" strokeWidth="3"/>
      <rect x="375" y="100" width="72" height="70" fill="#845d47"/><rect x="380" y="102" width="62" height="13" fill="#dfbe94"/>
      {christmas ? <g><rect x="499" y="178" width="12" height="43" fill="#7d4d36"/><path d="M503 83l-43 63h15l-24 44h105l-23-44h14Z" fill="#3b6b53"/><path d="M480 140l45 18M469 168l63 15" stroke="#d8b76b" strokeWidth="4"/><path d="M501 76h7v16h-7M496 81h17v6h-17" fill="#ffe0a0"/>{[478,507,530].map((x,i)=><rect key={x} x={x} y={154+i*13} width="7" height="7" fill="#d79077"/>)}<rect x="465" y="210" width="25" height="21" fill="#c27b68"/><path d="M477 210v21" stroke="#f2d398" strokeWidth="4"/></g> : <><Tree x={506} y={204}/><rect x="490" y="195" width="34" height="25" fill="#b7795c"/></>}
      <path d="M40 390v70M276 568h49" stroke="#ecc597" strokeWidth="7"/>
    </>}
    {place === "bus" && <>
      <rect y="255" width="600" height="127" fill="#676f73"/><path d="M0 321h600" stroke="#e6dcc2" strokeWidth="4" strokeDasharray="30 24"/><rect y="382" width="600" height="101" fill="url(#paving)"/>
      <rect x="104" y="128" width="103" height="17" fill="#4d665f"/><path d="M114 146v93M198 146v93" stroke="#4d665f" strokeWidth="7"/><rect x="119" y="152" width="73" height="59" fill="#9fb8b0"/><rect x="120" y="220" width="71" height="10" fill="#986e4e"/>
      <rect x="325" y="116" width="220" height="101" rx="5" fill="#dbc184"/><rect x="328" y="129" width="212" height="47" fill="#5e878b"/>{[379,431,487].map(x=><path key={x} d={`M${x} 129v46`} stroke="#dbc184" strokeWidth="5"/>)}<rect x="334" y="186" width="157" height="8" fill="#b9855e"/><rect x="493" y="176" width="38" height="37" fill="#658180"/><circle cx="363" cy="216" r="15" fill="#394449"/><circle cx="503" cy="216" r="15" fill="#394449"/><circle cx="363" cy="216" r="6" fill="#9aa39c"/><circle cx="503" cy="216" r="6" fill="#9aa39c"/>
      <path d="M246 192v55" stroke="#606a58" strokeWidth="5"/><circle cx="246" cy="185" r="15" fill="#e4cd83"/><text x="246" y="190" textAnchor="middle" fill="#527251" fontSize="17" fontWeight="bold">H</text><rect x="107" y="110" width="97" height="17" fill="#e9d9b0"/><text x="156" y="122" textAnchor="middle" fill="#52634d" fontSize="10" fontFamily="monospace">RADEGAST</text><text x="433" y="128" textAnchor="middle" fill="#f5e7bc" fontSize="10" fontFamily="monospace">ZÖRBIG</text>
      <Tree x={56} y={208}/><Tree x={547} y={537}/><path d="M90 531h321" stroke="#b1bd93" strokeWidth="8"/>
    </>}
    {place === "school" && <>
      <rect width="600" height="600" fill="url(#paving)"/>
      <rect width="600" height="134" fill="#b0aa98"/><rect width="600" height="16" fill="#777b79"/>
      {[35,85].map(y=>[90,155,220,350,415,480,545].map(x=><g key={`${x}-${y}`}><rect x={x-22} y={y-9} width="44" height="27" fill="#60716b"/><path d={`M${x-22} ${y-9}h44v27h-44ZM${x} ${y-9}v27`} stroke="#ede9df" strokeWidth="3" fill="none"/></g>))}
      {[90,155,220,350,415,480,545].map(x=><g key={x}><rect x={x-22} y="114" width="44" height="16" fill="#52615c"/>{[-16,-8,0,8,16].map(dx=><path key={dx} d={`M${x+dx} 114v16`} stroke="#c5d0cb" strokeWidth="2"/>)}</g>)}
      <rect x="260" y="85" width="80" height="49" fill="#465652"/><path d="M270 92h60v37h-60ZM300 92v37" stroke="#84928b" strokeWidth="3" fill="none"/>
      <path d="M253 134h94v16h-94Z" fill="#c1bca9"/><path d="M253 138h94M253 143h94M253 148h94" stroke="#8e958c" strokeWidth="2"/>
      <path d="M20 58h40v35l20 25v30M20 58v77h60M20 72h40M20 94h40M20 116h40" stroke="#a6b5b2" strokeWidth="4" fill="none"/>
      <path d="M0 393 600 483" stroke="#ba765a" strokeWidth="44"/>
      <path d="M50 458 194 481 184 502 243 528 257 562 176 551 55 519Z" fill="#78966b"/>
      <path d="M107 443 200 465 184 493 241 525 257 555M49 515 164 539 176 552M284 482 326 525" stroke="#a16851" strokeWidth="10" fill="none"/>
      {[{x:235,y:257},{x:403,y:270},{x:287,y:365},{x:448,y:386}].map(p=><g key={p.x}><path d={`M${p.x-36} ${p.y-16}l36 -16 39 16 -39 25Z`} fill="#956d4e"/><circle cx={p.x} cy={p.y-23} r="41" fill="#627e42"/><circle cx={p.x-15} cy={p.y-29} r="27" fill="#7c9850"/><circle cx={p.x+19} cy={p.y-26} r="29" fill="#6f9048"/></g>)}
      <path d="M0 145h48M0 330h50M570 145v455M0 580h230M380 580h60" stroke="#627e42" strokeWidth="24"/>
      <path d="M268 560v40M341 560v40" stroke="#a16851" strokeWidth="16"/>
    </>}
    {place === "range" && <>
      <rect width="600" height="211" fill="#b8baa3"/><path d="M0 192h600" stroke="#8c6d4d" strokeWidth="16"/>
      {[150,300,450].map(x=><g key={x}><rect x={x-40} y="74" width="80" height="88" fill="#6b6555"/><rect x={x-34} y="80" width="68" height="73" fill="#efe1b8"/>{[26,20,14,8].map((r,i)=><circle key={r} cx={x} cy="116" r={r} fill={i>1?"#394840":"none"} stroke="#4d594e" strokeWidth="2"/>)}</g>)}<path d="M120 219v110M300 219v110M480 219v110M65 389h470" stroke="#d4ba82" strokeWidth="4" strokeDasharray="12 9"/>
      <rect x="62" y="429" width="108" height="46" fill="#80644e"/><rect x="64" y="421" width="104" height="15" fill="#c8a87d"/>
    </>}
    <rect x="3" y="3" width="594" height="594" fill="none" stroke={outdoors ? "#556b4e" : "#6b4c3e"} strokeWidth="6"/>
  </svg>;
});

export function PersonArt({ variant }: { variant: string }) {
  const palette: Record<string,string> = { elias: "#647f92", mother: "#b77970", stepfather: "#607657", halfsister: "#ba975e", "partner-one": "#777d9c", stepsister: "#9c7291", "partner-two": "#759c95", family: "#b77970" };
  const shirt = palette[variant] ?? "#9e9772";
  return <svg viewBox="0 0 24 32" shapeRendering="crispEdges" aria-hidden="true"><path d="M6 29h12v3H6Z" fill="#30433e" opacity=".3"/><path d="M7 19h10v7H7M7 25h4v5H7M14 25h4v5h-4" fill="#465464"/><path d="M5 12h14v10H5M3 14h3v8H3M18 14h3v8h-3" fill={shirt}/><path d="M7 3h11v10H7M5 5h3v5H5" fill="#e6b793"/><path d="M6 2h12v4H6M6 4h3v4H6M16 4h3v5h-3" fill={variant === "family" ? "#806153" : "#56473b"}/><path d="M10 8h2v2h-2M16 8h2v2h-2" fill="#3a3b36"/><path d="M11 12h5v2h-5" fill="#d69e80"/><path d="M6 29h6v2H6M14 29h5v2h-5" fill="#423b38"/></svg>;
}
export function DogArt() {
  return <svg viewBox="0 0 36 28" shapeRendering="crispEdges" aria-hidden="true"><path d="M4 24h27v3H4Z" fill="#30433e" opacity=".25"/><path d="M7 11h20v12H7M7 21h5v5H7M23 20h5v6h-5" fill="#b99972"/><path d="M9 19h15v4H9M8 23h4v3H8M24 23h4v3h-4" fill="#f1e5cb"/><path d="M6 17H2V7h4V3h8v4h3v7H9v-4h4V8H7v7h3v4H6Z" fill="#e7d9bb"/><path d="M20 2h4v5h-5V4h1M30 2h3v3h2v5h-5" fill="#4d4a40"/><path d="M21 7h12v13H21M18 10h17v8H18" fill="#4d4a40"/><path d="M22 16h10v6H22M25 13h5v7h-5" fill="#e9d9b9"/><path d="M22 11h2v2h-2M30 11h2v2h-2M26 16h5v3h-5" fill="#202d2b"/><path d="M20 21h13v2H20" fill="#a9705e"/></svg>;
}

export function ItemArt({ art }: { art: string }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true">
    {art === "book" ? <><rect x="4" y="3" width="16" height="19" rx="2" fill="#674638"/><path d="M6 4h13v15H6Z" fill="#ad745b"/><path d="M7 4v15M10 8h6M10 11h6" stroke="#e5cfa6" strokeWidth="1.2"/><path d="M7 20h11" stroke="#eddfbd"/></>
    : art === "photo" ? <><rect x="3" y="2" width="18" height="21" rx="1" fill="#eadbbe" stroke="#78553c"/><path d="M5 4h14v13H5Z" fill="#9ba68c"/><path d="m5 16 5-8 4 4 2-3 3 7" fill="#536b52"/><circle cx="16" cy="7" r="2" fill="#f2d497"/></>
    : art === "certificate" ? <><rect x="3" y="3" width="18" height="23" rx="1" fill="#f8edd2" stroke="#bd985c"/><path d="M7 8h10M7 12h10M7 15h7" stroke="#997e55" strokeWidth="1"/><circle cx="15" cy="21" r="3" fill="#ae7849"/><path d="M14 23l-1 4 2-1 2 1-1-4" fill="#c19b59"/></>
    : art === "camera" ? <><rect x="1" y="8" width="22" height="16" rx="3" fill="#465951"/><path d="M6 8l2-4h8l2 4" fill="#465951"/><circle cx="12" cy="16" r="6" fill="#d5c79e"/><circle cx="12" cy="16" r="4" fill="#6d9393"/><rect x="18" y="10" width="3" height="2" fill="#e9dba4"/></>
    : art === "ticket" ? <><rect x="2" y="6" width="20" height="12" rx="2" fill="#e8cf9e" stroke="#826642"/><path d="M16 7v10M5 10h7M5 13h5" stroke="#7f755c" strokeWidth="1" strokeDasharray="2 1"/></>
    : art === "sign" ? <><path d="M12 11v13" stroke="#5d6254" strokeWidth="2"/><rect x="3" y="1" width="18" height="15" rx="2" fill="#e4d8ae" stroke="#6c7b53"/><path d="M8 4v9M16 4v9M8 8h8" stroke="#5f7851" strokeWidth="2"/></>
    : art === "bowl" || art === "plates" ? <><ellipse cx="12" cy="19" rx="10" ry="3" fill="#3c493c" opacity=".25"/><path d="M3 10q0 10 9 10t9-10" fill="#c7c5ab" stroke="#777f70"/><ellipse cx="12" cy="10" rx="9" ry="4" fill={art === "bowl" ? "#86adb3" : "#efe5cd"} stroke="#d9dcc6"/><path d="M7 9q5-2 10 0" fill="none" stroke="#f0efdb"/></>
    : art === "cushion" ? <><rect x="2" y="6" width="20" height="14" rx="6" fill="#c89f75" stroke="#836757" strokeWidth="1.2"/><path d="M6 9q6-3 12 0M5 17q7 2 14 0" stroke="#e6cbae" fill="none"/><ellipse cx="12" cy="13" rx="3" ry="2" fill="#b08a63"/></>
    : art === "bed" ? <><rect x="1" y="7" width="22" height="15" rx="5" fill="#836757"/><rect x="3" y="6" width="18" height="13" rx="3" fill="#bd9277"/><path d="M4 10h16M4 14h16M8 7v11M15 7v11" stroke="#dcc0a0" strokeWidth=".7"/><path d="M4 18q7 3 16 0" stroke="#6e574b" fill="none"/></>
    : art === "ball" ? <><ellipse cx="12" cy="21" rx="8" ry="2" fill="#3c493c" opacity=".25"/><circle cx="12" cy="12" r="9" fill="#c69a60" stroke="#8e714b"/><path d="M5 7q11-3 13 10M8 4q-3 12 8 16" fill="none" stroke="#efd2a0" strokeWidth="2"/><circle cx="8" cy="7" r="2" fill="#f7e2ba" opacity=".5"/></>
    : art === "target" ? <>{[10,7,4,1].map((r,i)=><circle key={r} cx="12" cy="12" r={r} fill={i%2 ? "#657365" : "#e9d6b2"}/>)}</>
    : art === "bell" ? <><path d="M5 17h14l-3-4V9a4 4 0 0 0-8 0v4Z" fill="#d3b378" stroke="#82653e"/><circle cx="12" cy="19" r="2" fill="#82653e"/><path d="M12 3v2" stroke="#82653e" strokeWidth="2"/></>
    : <><ellipse cx="12" cy="13" rx="10" ry="7" fill="#e9dcc1" stroke="#a8916e"/><ellipse cx="12" cy="13" rx="6" ry="4" fill="none" stroke="#c1ac84"/><path d="M1 5v14M23 5v14" stroke="#b0b5a3"/></>}
  </svg>;
}
