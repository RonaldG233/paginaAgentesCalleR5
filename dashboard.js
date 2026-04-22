const apiURL = "https://script.google.com/macros/s/AKfycbzuTq3oDcITUAdzRQkrQjXtemUvqgVmsZFWMdCbr0rveBpZnZllINTqYfUHnTiVqkqglQ/exec";

let datosZonas=[];
let datosAgentes=[];

// ================= INIT =================
async function iniciarDashboard(){
    try{
        await cargarTodo();
        verificarActualizacion();
    }catch(e){
        console.log("Error cargando datos:", e);
    }

    mostrarFecha();
}

// ================= CARGA GENERAL =================
async function cargarTodo(){
    try{
        const res = await fetch(apiURL + "?t=" + new Date().getTime());
        const data = await res.json();

        datosZonas = data.zonas || [];
        datosAgentes = data.agentes || [];

        llenarSelectZonas();
        mostrarZonas(datosZonas);

        llenarSelectAgentes();
        mostrarAgentes(datosAgentes);

    }catch(e){
        console.log("Error cargando:", e);
        datosZonas=[];
        datosAgentes=[];
    }
}

// ================= ACTUALIZACION =================
function verificarActualizacion(){

    const datosActuales = JSON.stringify({
        zonas: datosZonas,
        agentes: datosAgentes
    });

    const datosGuardados = localStorage.getItem("datosGuardados");

    if(!datosGuardados || datosGuardados !== datosActuales){
        localStorage.setItem("datosGuardados", datosActuales);

        const ahora = new Date();
        localStorage.setItem("fechaActualizacion", ahora.toISOString());
    }
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

    const totales = calcularTotalesPorZona(datos);

    let zonaActual = "";

    datos.forEach((fila,index)=>{

        if(zonaActual !== "" && zonaActual !== fila.ZONA){
            insertarTotales(body, totales[zonaActual], zonaActual);
        }

        zonaActual = fila.ZONA;

        const clase=index%2===0?"grupoA":"grupoB";

        const tr1=document.createElement("tr");
        tr1.classList.add(clase);

        let porcentaje=porcentajeSeguro(fila["CUMPLIMIENTO INSTALADAS"]);

        tr1.innerHTML=`
        <td class="negrilla">INSTALADAS</td>
        <td>${limpiar(fila.ZONA)}</td>
        <td>${limpiar(fila.DISTRITO)}</td>
        <td>${limpiar(fila["METAS INSTALADAS"])}</td>
        <td class="negrilla">${limpiar(fila.INSTALADAS)}</td>
        <td>${limpiar(fila["PROYECCION INSTALADAS"])}</td>
        <td class="porcentaje">${porcentaje.toFixed(1)}%</td>
        <td>${limpiar(fila["DEBERIA LLEVAR INSTALADAS"])}</td>
        <td>${limpiar(fila["DIFERENCIA INSTALADAS"])}</td>
        `;

        body.appendChild(tr1);

        const tr2=document.createElement("tr");
        tr2.classList.add(clase);

        let porcentajeD=porcentajeSeguro(fila["CUMPLIMIENTO DIGITADAS"]);

        tr2.innerHTML=`
        <td class="negrilla">DIGITADAS</td>
        <td></td>
        <td></td>
        <td>${limpiar(fila["METAS DIGITADAS"])}</td>
        <td class="negrilla">${limpiar(fila.DIGITADAS)}</td>
        <td>${limpiar(fila["PROYECCION DIGITADAS"])}</td>
        <td class="porcentaje">${porcentajeD.toFixed(1)}%</td>
        <td>${limpiar(fila["DEBERIA LLEVAR"])}</td>
        <td>${limpiar(fila.DIFERENCIA)}</td>
        `;

        body.appendChild(tr2);

    });

    if(zonaActual){
        insertarTotales(body, totales[zonaActual], zonaActual);
    }

    aplicarColores();
}

// ================= INSERTAR TOTALES =================
function insertarTotales(body, total, zona){

    const trI=document.createElement("tr");
    trI.classList.add("total-zona");

    trI.innerHTML=`
        <td class="negrilla">TOTAL INSTALADAS</td>
        <td colspan="2">${zona}</td>
        <td>${total.instaladas.metas}</td>
        <td>${total.instaladas.valor}</td>
        <td>${total.instaladas.proyeccion}</td>
        <td class="porcentaje">${total.instaladas.porcentaje.toFixed(1)}%</td>
        <td>-</td>
        <td>${total.instaladas.diferencia}</td>
    `;

    body.appendChild(trI);

    const trD=document.createElement("tr");
    trD.classList.add("total-zona");

    trD.innerHTML=`
        <td class="negrilla">TOTAL DIGITADAS</td>
        <td colspan="2"></td>
        <td>${total.digitadas.metas}</td>
        <td>${total.digitadas.valor}</td>
        <td>${total.digitadas.proyeccion}</td>
        <td class="porcentaje">${total.digitadas.porcentaje.toFixed(1)}%</td>
        <td>-</td>
        <td>${total.digitadas.diferencia}</td>
    `;

    body.appendChild(trD);
}

// ================= TOTALES CORREGIDOS =================
function calcularTotalesPorZona(datos){

    const totales = {};

    datos.forEach(fila => {

        const zona = fila.ZONA;

        if(!totales[zona]){
            totales[zona] = {
                instaladas:{metas:0,valor:0,proyeccion:0,diferencia:0,porcentaje:0},
                digitadas:{metas:0,valor:0,proyeccion:0,diferencia:0,porcentaje:0}
            };
        }

        // SUMAS INSTALADAS
        totales[zona].instaladas.metas += Number(fila["METAS INSTALADAS"])||0;
        totales[zona].instaladas.valor += Number(fila.INSTALADAS)||0;
        totales[zona].instaladas.proyeccion += Number(fila["PROYECCION INSTALADAS"])||0;
        totales[zona].instaladas.diferencia += Number(fila["DIFERENCIA INSTALADAS"])||0;

        // SUMAS DIGITADAS
        totales[zona].digitadas.metas += Number(fila["METAS DIGITADAS"])||0;
        totales[zona].digitadas.valor += Number(fila.DIGITADAS)||0;
        totales[zona].digitadas.proyeccion += Number(fila["PROYECCION DIGITADAS"])||0;
        totales[zona].digitadas.diferencia += Number(fila.DIFERENCIA)||0;
    });

    // 🔥 CALCULO DEL PORCENTAJE (PROYECCION / META)
    for(let zona in totales){

        let i = totales[zona].instaladas;
        let d = totales[zona].digitadas;

        i.porcentaje = i.metas > 0 ? (i.proyeccion / i.metas) * 100 : 0;
        d.porcentaje = d.metas > 0 ? (d.proyeccion / d.metas) * 100 : 0;
    }

    return totales;
}
function mostrarAgentes(datos){

    const body=document.getElementById("bodyAgentes");
    body.innerHTML="";

    const totales = calcularTotalesPorAgente(datos);

    let agenteActual = "";

    datos.forEach((a,index)=>{

        if(agenteActual !== "" && agenteActual !== a.AGENTES){
            insertarTotalesAgente(body, totales[agenteActual], agenteActual);
        }

        agenteActual = a.AGENTES;

        const clase=index%2===0?"grupoA":"grupoB";

        const tr1=document.createElement("tr");
        tr1.classList.add(clase);

        let porcentajeI=porcentajeSeguro(a["CUMPLIMIENTO INSTALADAS"]);

        tr1.innerHTML=`
        <td class="negrilla">INSTALADAS</td>
        <td>${limpiar(a.AGENTES)}</td>
        <td>${limpiar(a.ZONA)}</td>
        <td>${limpiar(a.DISTRITO)}</td>
        <td>${limpiar(a["METAS INSTALADAS"])}</td>
        <td class="negrilla">${limpiar(a.INSTALADAS)}</td>
        <td>${limpiar(a["PROYECCION INSTALADAS"])}</td>
        <td class="porcentaje">${porcentajeI.toFixed(1)}%</td>
        <td>${limpiar(a["DEBERIA LLEVAR"])}</td>
        <td>${limpiar(a["DIFERENCIA"])}</td>
        `;

        body.appendChild(tr1);

        const tr2=document.createElement("tr");
        tr2.classList.add(clase);

        let porcentajeD=porcentajeSeguro(a["CUMPLIMIENTO DIGITADAS"]);

        tr2.innerHTML=`
        <td class="negrilla">DIGITADAS</td>
        <td></td>
        <td></td>
        <td></td>
        <td>${limpiar(a["METAS DIGITADAS"])}</td>
        <td class="negrilla">${limpiar(a.DIGITADAS)}</td>
        <td>${limpiar(a["PROYECCION DIGITADAS"])}</td>
        <td class="porcentaje">${porcentajeD.toFixed(1)}%</td>
        <td>${limpiar(a["DEBERIA LLEVAR"])}</td>
        <td>${limpiar(a["DIFERENCIA"])}</td>
        `;

        body.appendChild(tr2);

    });

    if(agenteActual){
        insertarTotalesAgente(body, totales[agenteActual], agenteActual);
    }

    aplicarColores();
}

function calcularTotalesPorAgente(datos){

    const totales = {};

    datos.forEach(a => {

        const agente = a.AGENTES;

        if(!totales[agente]){
            totales[agente] = {
                instaladas:{metas:0,valor:0,proyeccion:0,diferencia:0,porcentaje:0},
                digitadas:{metas:0,valor:0,proyeccion:0,diferencia:0,porcentaje:0}
            };
        }

        // SUMAS INSTALADAS
        totales[agente].instaladas.metas += Number(a["METAS INSTALADAS"])||0;
        totales[agente].instaladas.valor += Number(a.INSTALADAS)||0;
        totales[agente].instaladas.proyeccion += Number(a["PROYECCION INSTALADAS"])||0;
        totales[agente].instaladas.diferencia += Number(a["DIFERENCIA"])||0;

        // SUMAS DIGITADAS
        totales[agente].digitadas.metas += Number(a["METAS DIGITADAS"])||0;
        totales[agente].digitadas.valor += Number(a.DIGITADAS)||0;
        totales[agente].digitadas.proyeccion += Number(a["PROYECCION DIGITADAS"])||0;
        totales[agente].digitadas.diferencia += Number(a["DIFERENCIA"])||0;
    });

    // 🔥 CALCULO DEL PORCENTAJE (PROYECCION / META)
    for(let agente in totales){

        let i = totales[agente].instaladas;
        let d = totales[agente].digitadas;

        i.porcentaje = i.metas > 0 ? (i.proyeccion / i.metas) * 100 : 0;
        d.porcentaje = d.metas > 0 ? (d.proyeccion / d.metas) * 100 : 0;
    }

    return totales;
}
function insertarTotalesAgente(body, total, agente){

    const trI=document.createElement("tr");
    trI.classList.add("total-zona");

    trI.innerHTML=`
        <td class="negrilla">TOTAL INSTALADAS</td>
        <td colspan="3">${agente}</td>
        <td>${total.instaladas.metas}</td>
        <td>${total.instaladas.valor}</td>
        <td>${total.instaladas.proyeccion}</td>
        <td class="porcentaje">${total.instaladas.porcentaje.toFixed(1)}%</td>
        <td>-</td>
        <td>${total.instaladas.diferencia}</td>
    `;

    body.appendChild(trI);

    const trD=document.createElement("tr");
    trD.classList.add("total-zona");

    trD.innerHTML=`
        <td class="negrilla">TOTAL DIGITADAS</td>
        <td colspan="3"></td>
        <td>${total.digitadas.metas}</td>
        <td>${total.digitadas.valor}</td>
        <td>${total.digitadas.proyeccion}</td>
        <td class="porcentaje">${total.digitadas.porcentaje.toFixed(1)}%</td>
        <td>-</td>
        <td>${total.digitadas.diferencia}</td>
    `;

    body.appendChild(trD);
}



// ================= UTILIDADES =================
function limpiar(valor){
    if(valor===undefined || valor===null || valor==="" || valor==="#REF!" || valor==="#DIV/0!" || valor==="NaN"){
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

// ================= FECHA =================
function mostrarFecha(){

    if(datosZonas.length === 0){
        document.getElementById("fechaHoy").textContent = "Sin datos";
        return;
    }

    // 🔥 TOMAMOS LA FECHA DE LA PRIMERA FILA
    let fecha = datosZonas[0]["ULTIMA ACTUALIZACION"];

    if(!fecha){
        document.getElementById("fechaHoy").textContent = "Sin actualización";
        return;
    }

    document.getElementById("fechaHoy").textContent =
        "Actualizado: " + fecha;
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