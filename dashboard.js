const apiZonas="https://sheetdb.io/api/v1/a5i10sd9u7ehb";
const apiAgentes="https://sheetdb.io/api/v1/ozvx36oam9947";

let datosZonas=[];
let datosAgentes=[];

// ================= INIT =================
async function iniciarDashboard(){

    await cargarZonas();
    await cargarAgentes();

    guardarFechaActualizacion(); // 🔥 NUEVO
    mostrarFecha();
}

// ================= CARGAS =================
async function cargarZonas(){
    try{
        const res=await fetch(apiZonas);
        const datos=await res.json();

        datosZonas=datos;

        llenarSelectZonas();
        mostrarZonas(datosZonas);

    }catch(e){console.log(e);}
}

async function cargarAgentes(){
    try{
        const res=await fetch(apiAgentes+"?t="+new Date().getTime());
        const datos=await res.json();

        datosAgentes=datos;

        llenarSelectAgentes();
        mostrarAgentes(datosAgentes);

    }catch(e){console.log(e);}
}

// ================= SELECTS =================
function llenarSelectZonas(){
    const select=document.getElementById("selectZona");

    select.innerHTML='<option value="">TODAS LAS ZONAS</option>';

    const zonas=[...new Set(datosZonas.map(f=>f.ZONA))];
    zonas.sort();

    zonas.forEach(z=>{
        select.innerHTML+=`<option value="${z}">${z}</option>`;
    });

    select.addEventListener("change",()=>{
        const zona=select.value;

        if(zona==""){
            mostrarZonas(datosZonas);
            return;
        }

        const filtrado=datosZonas.filter(f=>f.ZONA==zona);
        mostrarZonas(filtrado);
    });
}

function llenarSelectAgentes(){
    const select=document.getElementById("selectAgente");

    select.innerHTML='<option value="">TODOS LOS AGENTES</option>';

    const agentes=[...new Set(datosAgentes.map(a=>a.AGENTES))];
    agentes.sort();

    agentes.forEach(a=>{
        select.innerHTML+=`<option value="${a}">${a}</option>`;
    });

    select.addEventListener("change",()=>{
        const agente=select.value;

        if(agente==""){
            mostrarAgentes(datosAgentes);
            return;
        }

        const filtrado=datosAgentes.filter(a=>a.AGENTES==agente);
        mostrarAgentes(filtrado);
    });
}

// ================= TABLA ZONAS =================
function mostrarZonas(datos){

    const body=document.getElementById("bodyZonas");
    body.innerHTML="";

    datos.forEach((fila,index)=>{

        const clase=index%2===0?"grupoA":"grupoB";

        // 🔹 INSTALADAS
        const tr1=document.createElement("tr");
        tr1.classList.add(clase);

        let porcentaje=porcentajeSeguro(fila["CUMPLIMIENTO INSTALADAS"]);

        tr1.innerHTML=`
        <td>${limpiar(fila.ZONA)}</td>
        <td>${limpiar(fila.DISTRITO)}</td>
        <td>${limpiar(fila["METAS INSTALADAS"])}</td>
        <td>${limpiar(fila.INSTALADAS)}</td>
        <td>${limpiar(fila["PROYECCION INSTALADAS"])}</td>
        <td class="porcentaje">${porcentaje.toFixed(1)}%</td>
        <td>${limpiar(fila["DEBERIA LLEVAR INSTALADAS"])}</td>
        <td>${limpiar(fila["DIFERENCIA INSTALADAS"])}</td>
        `;

        body.appendChild(tr1);

        // 🔹 DIGITADAS
        const tr2=document.createElement("tr");
        tr2.classList.add(clase);

        let porcentajeD=porcentajeSeguro(fila["CUMPLIMIENTO DIGITADAS"]);

        tr2.innerHTML=`
        <td style="font-weight:bold;">DIGITADAS</td>
        <td></td>
        <td>${limpiar(fila["METAS DIGITADAS"])}</td>
        <td>${limpiar(fila.DIGITADAS)}</td>
        <td>${limpiar(fila["PROYECCION DIGITADAS"])}</td>
        <td class="porcentaje">${porcentajeD.toFixed(1)}%</td>
        <td>${limpiar(fila["DEBERIA LLEVAR"])}</td>
        <td>${limpiar(fila.DIFERENCIA)}</td>
        `;

        body.appendChild(tr2);

    });

    aplicarColores();
}

// ================= TABLA AGENTES =================
function mostrarAgentes(datos){

    const body=document.getElementById("bodyAgentes");
    body.innerHTML="";

    datos.forEach((a,index)=>{

        const clase=index%2===0?"grupoA":"grupoB";

        // 🔹 INSTALADAS
        const tr1=document.createElement("tr");
        tr1.classList.add(clase);

        let porcentajeI=porcentajeSeguro(a["CUMPLIMIENTO INSTALADAS"]);

        tr1.innerHTML=`
        <td>${limpiar(a.AGENTES)}</td>
        <td>${limpiar(a.ZONA)}</td>
        <td>${limpiar(a.DISTRITO)}</td>
        <td>${limpiar(a["METAS INSTALADAS"])}</td>
        <td>${limpiar(a.INSTALADAS)}</td>
        <td>${limpiar(a["PROYECCION INSTALADAS"])}</td>
        <td class="porcentaje">${porcentajeI.toFixed(1)}%</td>
        <td>${limpiar(a["DEBERIA LLEVAR"])}</td>
        <td>${limpiar(a["DIFERENCIA"])}</td>
        `;

        body.appendChild(tr1);

        // 🔹 DIGITADAS
        const tr2=document.createElement("tr");
        tr2.classList.add(clase);

        let porcentajeD=porcentajeSeguro(a["CUMPLIMIENTO DIGITADAS"]);

        tr2.innerHTML=`
        <td style="font-weight:bold;">DIGITADAS</td>
        <td></td>
        <td></td>
        <td>${limpiar(a["METAS DIGITADAS"])}</td>
        <td>${limpiar(a.DIGITADAS)}</td>
        <td>${limpiar(a["PROYECCION DIGITADAS"])}</td>
        <td class="porcentaje">${porcentajeD.toFixed(1)}%</td>
        <td>${limpiar(a["DEBERIA LLEVAR"])}</td>
        <td>${limpiar(a["DIFERENCIA"])}</td>
        `;

        body.appendChild(tr2);

    });

    aplicarColores();
}

// ================= UTILIDADES =================
function limpiar(valor){

    if(
        valor===undefined ||
        valor===null ||
        valor==="" ||
        valor==="#REF!" ||
        valor==="#DIV/0!" ||
        valor==="#¡DIV/0!" ||
        valor==="NaN" ||
        valor==="NaN%"
    ){
        return 0;
    }

    return valor;
}

function porcentajeSeguro(valor){

    valor = limpiar(valor);

    if(typeof valor === "string"){
        valor = valor.replace("%","").trim();
    }

    let num = Number(valor);

    if(isNaN(num)) return 0;

    return num;
}

// ================= FECHA (NUEVO) =================
function guardarFechaActualizacion(){

    const ahora = new Date();
    localStorage.setItem("fechaActualizacion", ahora.toISOString());

}

function mostrarFecha(){

    let fechaGuardada = localStorage.getItem("fechaActualizacion");

    if(!fechaGuardada){
        document.getElementById("fechaHoy").textContent = "Sin actualizaciones";
        return;
    }

    const fecha = new Date(fechaGuardada);

    const opciones={
        year:'numeric',
        month:'long',
        day:'numeric'
    };

    document.getElementById("fechaHoy").textContent=
    "Actualizado: "+fecha.toLocaleDateString("es-ES",opciones);
}

// ================= COLORES =================
function aplicarColores(){

    document.querySelectorAll(".porcentaje").forEach(td=>{

        let valor=parseFloat(td.textContent.replace("%",""));

        if(isNaN(valor)) return;

        if(valor<70){
            td.style.background="#ff4d4d";
            td.style.color="white";
        }
        else if(valor<100){
            td.style.background="#ffd633";
        }
        else{
            td.style.background="#28a745";
            td.style.color="#fff";
        }

    });
}

window.onload=iniciarDashboard;