import os
import re
import time
import urllib.parse
from pathlib import Path

import msal
import pandas as pd
import requests
from dotenv import load_dotenv


BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

OUT_CSV = BASE_DIR / "sharepoint_list_fields.csv"
OUT_REDUCED_CSV = BASE_DIR / "sharepoint_list_fields_reducido.csv"
OUT_USED_CSV = BASE_DIR / "sharepoint_list_fields_utilizados.csv"

REDUCED_LISTS = {
    "ConsultaInformacion",
    "Sugerencias",
    "Agradecimientos",
    "Objetos Perdidos NUEVA",
    "Objetos Perdidos",
    "ClientesTarjetaMetro",
}

LIST_ALIASES = {
    "Objetos Perdidos NUEVA": "Objetos Perdidos",
}

TECHNICAL_FIELDS = {
    "Attachments",
    "ContentType",
    "Edit",
    "DocIcon",
    "LinkTitle",
    "LinkTitleNoMenu",
}

COMMON_CONECTA_USED_FIELDS = {
    "Title",
    "Nombre",
    "Apellidos",
    "TipoDeDocumento",
    "NumeroDeDocumento",
    "CorreoElectronico",
    "Telefono",
    "Nacionalidad",
    "Direccion",
    "Numero",
    "Escalera",
    "Piso",
    "Puerta",
    "CP",
    "Localidad",
    "Provincia",
    "EstadoCliente",
}

USED_FIELDS_BY_LIST = {
    "ConsultaInformacion": COMMON_CONECTA_USED_FIELDS | {
        "TipoDeTitulo",
        "NumTituloViaje",
        "Descripcion",
        "FechaModificacionEstadoCliente",
    },
    "Sugerencias": COMMON_CONECTA_USED_FIELDS | {
        "Estacion",
        "OtraUbicacion",
        "TipoDeTitulo",
        "NumTituloViaje",
        "Descripcion",
        "FechaModificacionEstadoCliente",
    },
    "Agradecimientos": COMMON_CONECTA_USED_FIELDS | {
        "Motivo",
        "FechaEpisodio",
        "Lugar",
        "Estacion",
        "Tren",
        "DirigidoA",
        "Colectivos",
        "NumIdentificacionPersonaTrabajad",
        "Descripcion",
        "FechaModificacionEstadoCliente",
    },
    "ReclamacionesQuejas": COMMON_CONECTA_USED_FIELDS | {
        "Clasificacion",
        "FechaYHoraConsulta",
        "Lugar",
        "TipoDeTitulo",
        "NBilleteTitulo",
        "DAB",
        "PuntoDeVenta",
        "TipoDeInstalacion",
        "NClienteNTarjCredito",
        "ImporteAPagar",
        "DescripcionConsulta",
        "Observaciones",
    },
    "Objetos Perdidos": COMMON_CONECTA_USED_FIELDS | {
        "Estado",
        "TipoRegistro",
        "TipoDeTitulo",
        "NumTituloViaje",
        "FechaPerdida",
        "LineaMetro",
        "Localizacion",
        "EstPerdida",
        "NUnidadTren",
        "EstOrig",
        "EstDest",
        "TipoObjeto",
        "ColorObj",
        "DistintivoObj",
        "Descripcion",
        "Observaciones",
    },
    "ClientesTarjetaMetro": {
        "Title",
        "EstadoCliente",
        "NombreCliente",
        "ApellidoCliente1",
        "ApellidoCliente2",
        "DNICliente",
        "EmailCliente",
        "TelefonoCliente1",
        "TelefonoCliente2",
        "NombreRep",
        "ApellidoRep1",
        "ApellidoRep2",
        "DNIRep",
        "EmailRep",
        "TelefonoRep1",
        "TelefonoRep2",
        "Direccion",
        "Numero",
        "Escalera",
        "Piso",
        "Puerta",
        "CP",
        "Localidad",
        "Provincia",
        "MetodoNotificacion",
        "Firma",
    },
    "DocumentosAdjuntos": {
        "IDRef",
        "Visible",
    },
}

OPTIONAL_LIST_ENV_KEYS = [
    "LIST_URL_DOCUMENTOS_ADJUNTOS",
]

LIST_ENV_KEYS = [
    "LIST_URL_RECLAMACIONES",
    "LIST_URL_SUGERENCIAS",
    "LIST_URL_AGRADECIMIENTOS",
    "LIST_URL_OBJETOS_PERDIDOS",
    "LIST_URL_CLIENTES_TARJETA_METRO",
    "LIST_URL_CONSULTA_INFORMACION",
]

missing_urls = [key for key in LIST_ENV_KEYS if not os.environ.get(key)]

if missing_urls:
    raise ValueError(
        "Faltan URLs en el .env: " + ", ".join(missing_urls)
    )

LIST_URLS = [os.environ[key] for key in LIST_ENV_KEYS]
LIST_URLS.extend(os.environ[key] for key in OPTIONAL_LIST_ENV_KEYS if os.environ.get(key))


def get_token() -> str:
    tenant_id = os.environ.get("TENANT_ID")
    client_id = os.environ.get("CLIENT_ID")
    client_secret = os.environ.get("CLIENT_SECRET")

    missing = [
        name
        for name, value in {
            "TENANT_ID": tenant_id,
            "CLIENT_ID": client_id,
            "CLIENT_SECRET": client_secret,
        }.items()
        if not value
    ]

    if missing:
        raise ValueError(f"Faltan variables en .env: {', '.join(missing)}")

    app = msal.ConfidentialClientApplication(
        client_id=client_id,
        client_credential=client_secret,
        authority=f"https://login.microsoftonline.com/{tenant_id}",
    )

    result = app.acquire_token_for_client(
        scopes=["https://graph.microsoft.com/.default"]
    )

    if "access_token" not in result:
        raise RuntimeError(result)

    return result["access_token"]


def graph_get(url: str, token: str) -> dict:
    headers = {"Authorization": f"Bearer {token}"}

    while True:
        r = requests.get(url, headers=headers, timeout=60)

        if r.status_code == 429:
            wait = int(r.headers.get("Retry-After", "5"))
            print(f"Rate limit. Reintentando en {wait}s...")
            time.sleep(wait)
            continue

        if not r.ok:
            print("\nERROR GRAPH")
            print("URL:", url)
            print("STATUS:", r.status_code)
            print("BODY:", r.text)
            r.raise_for_status()

        return r.json()


def graph_get_all(url: str, token: str) -> list[dict]:
    rows = []

    while url:
        data = graph_get(url, token)
        rows.extend(data.get("value", []))
        url = data.get("@odata.nextLink")

    return rows


def parse_sharepoint_list_url(url: str) -> dict:
    parsed = urllib.parse.urlparse(url)
    path = urllib.parse.unquote(parsed.path)

    is_library = False
    match = re.search(r"^(/sites/[^/]+)/Lists/([^/]+)/", path, re.I)
    if not match:
        match = re.search(r"^(/sites/[^/]+)/([^/]+)/Forms/", path, re.I)
        is_library = True

    if not match:
        raise ValueError(f"No se pudo parsear la URL de lista: {url}")

    site_path = match.group(1)
    list_path_name = match.group(2)

    return {
        "hostname": parsed.hostname,
        "site_path": site_path,
        "list_path_name": list_path_name,
        "list_web_base": (
            f"{parsed.scheme}://{parsed.hostname}{site_path}/{list_path_name}"
            if is_library
            else f"{parsed.scheme}://{parsed.hostname}{site_path}/Lists/{list_path_name}"
        ),
        "original_url": url,
    }


def normalize_url(url: str) -> str:
    return urllib.parse.unquote(url or "").lower().rstrip("/")


def resolve_site_id(info: dict, token: str) -> str:
    url = (
        f"https://graph.microsoft.com/v1.0/sites/"
        f"{info['hostname']}:{info['site_path']}"
        f"?$select=id,displayName,webUrl"
    )
    return graph_get(url, token)["id"]


def resolve_list(site_id: str, info: dict, token: str) -> dict:
    url = (
        f"https://graph.microsoft.com/v1.0/sites/{site_id}/lists"
        f"?$select=id,name,displayName,webUrl"
    )

    lists = graph_get_all(url, token)
    target_base = normalize_url(info["list_web_base"])
    target_name = info["list_path_name"].lower()

    for lst in lists:
        if normalize_url(lst.get("webUrl")) == target_base:
            return lst

    for lst in lists:
        if (
            (lst.get("name") or "").lower() == target_name
            or (lst.get("displayName") or "").lower() == target_name
        ):
            return lst

    available = "\n".join(
        f"- {x.get('displayName')} | {x.get('name')} | {x.get('webUrl')}"
        for x in lists
    )

    raise RuntimeError(
        f"No se encontró la lista para {info['original_url']}\n\n"
        f"Listas disponibles:\n{available}"
    )


def column_type(col: dict) -> str:
    type_keys = [
        "text",
        "choice",
        "number",
        "dateTime",
        "boolean",
        "personOrGroup",
        "lookup",
        "currency",
        "calculated",
        "hyperlinkOrPicture",
        "term",
        "thumbnail",
        "contentApprovalStatus",
        "geolocation",
    ]

    return next(
        (key for key in type_keys if col.get(key) is not None),
        "unknown",
    )


def choice_values(col: dict) -> str | None:
    choice = col.get("choice")
    if not choice:
        return None

    choices = choice.get("choices") or []
    return "|".join(map(str, choices)) if choices else None


def default_value(col: dict) -> str | None:
    default = col.get("defaultValue")
    if not default:
        return None

    if isinstance(default, dict):
        return default.get("value")

    return str(default)


def get_nested(col: dict, parent: str, key: str):
    value = col.get(parent)
    if isinstance(value, dict):
        return value.get(key)
    return None


def export_fields() -> None:
    if not LIST_URLS:
        raise ValueError("No se ha cargado ninguna URL de lista desde el .env")

    token = get_token()
    rows = []

    for list_url in LIST_URLS:
        print(f"Procesando: {list_url}")

        info = parse_sharepoint_list_url(list_url)
        site_id = resolve_site_id(info, token)
        lst = resolve_list(site_id, info, token)

        # Sin $select para evitar errores por propiedades no soportadas en Graph.
        columns_url = (
            f"https://graph.microsoft.com/v1.0/sites/{site_id}"
            f"/lists/{lst['id']}/columns"
        )

        columns = graph_get_all(columns_url, token)

        for col in columns:
            col_type = column_type(col)

            rows.append({
                "site_path": info["site_path"],
                "site_id": site_id,
                "list_display_name": lst.get("displayName"),
                "list_name": lst.get("name"),
                "list_id": lst.get("id"),
                "list_web_url": lst.get("webUrl"),

                "field_display_name": col.get("displayName"),
                "field_internal_name_graph": col.get("name"),
                "field_internal_name_for_create": col.get("name"),
                "field_id": col.get("id"),

                "type": col_type,
                "required": col.get("required"),
                "hidden": col.get("hidden"),
                "read_only": col.get("readOnly"),
                "indexed": col.get("indexed"),
                "unique": col.get("enforceUniqueValues"),
                "default_value": default_value(col),
                "description": col.get("description"),

                "choices": choice_values(col),
                "choice_allow_text_entry": get_nested(col, "choice", "allowTextEntry"),
                "choice_display_as": get_nested(col, "choice", "displayAs"),

                "text_max_length": get_nested(col, "text", "maxLength"),
                "number_minimum": get_nested(col, "number", "minimum"),
                "number_maximum": get_nested(col, "number", "maximum"),
                "number_decimal_places": get_nested(col, "number", "decimalPlaces"),
                "date_time_display_as": get_nested(col, "dateTime", "displayAs"),
                "date_time_format": get_nested(col, "dateTime", "format"),

                "lookup_list_id": get_nested(col, "lookup", "listId"),
                "lookup_column_name": get_nested(col, "lookup", "columnName"),
                "lookup_allow_multiple": get_nested(col, "lookup", "allowMultipleValues"),

                "person_allow_multiple": get_nested(col, "personOrGroup", "allowMultipleSelection"),
                "person_choose_from_type": get_nested(col, "personOrGroup", "chooseFromType"),
                "person_display_as": get_nested(col, "personOrGroup", "displayAs"),

                "calculated_formula": get_nested(col, "calculated", "formula"),
                "calculated_output_type": get_nested(col, "calculated", "outputType"),
            })

    df = pd.DataFrame(rows)

    if df.empty:
        raise RuntimeError("No se han obtenido columnas de ninguna lista.")

    df = df.sort_values(
        [
            "site_path",
            "list_display_name",
            "hidden",
            "read_only",
            "field_display_name",
        ],
        na_position="last",
    )

    df.to_csv(OUT_CSV, index=False, encoding="utf-8-sig")
    export_reduced_fields(df)
    missing_used = export_used_fields(df)

    print(f"\nOK -> {OUT_CSV.resolve()}")
    print(f"OK -> {OUT_REDUCED_CSV.resolve()}")
    print(f"OK -> {OUT_USED_CSV.resolve()}")
    print(f"Listas procesadas: {len(LIST_URLS)}")
    print(f"Campos exportados: {len(df)}")
    print(f"Campos usados no encontrados: {len(missing_used)}")
    for item in missing_used:
        print(f"  - {item['lista']}: {item['nombre_interno']}")


def export_reduced_fields(df: pd.DataFrame) -> None:
    reduced = df[
        df["list_name"].isin(REDUCED_LISTS)
        & (df["hidden"] == False)
        & (df["read_only"] == False)
        & ~df["field_internal_name_for_create"].isin(TECHNICAL_FIELDS)
    ].copy()

    reduced = reduced.sort_values(
        ["list_display_name", "field_internal_name_for_create"],
        na_position="last",
    )

    reduced = reduced[[
        "list_display_name",
        "field_display_name",
        "field_internal_name_for_create",
        "type",
        "required",
        "default_value",
        "text_max_length",
        "date_time_format",
        "choices",
    ]].rename(columns={
        "list_display_name": "lista",
        "field_display_name": "nombre_visual",
        "field_internal_name_for_create": "nombre_interno",
        "type": "tipo_sharepoint",
        "required": "obligatorio_sharepoint",
        "default_value": "valor_defecto",
        "text_max_length": "longitud_maxima",
        "date_time_format": "formato_fecha",
        "choices": "opciones",
    })

    reduced.to_csv(OUT_REDUCED_CSV, index=False, encoding="utf-8-sig")


def export_used_fields(df: pd.DataFrame) -> list[dict]:
    used_rows = []

    for list_name, fields in USED_FIELDS_BY_LIST.items():
        export_list_name = LIST_ALIASES.get(list_name, list_name)
        subset = df[
            (df["list_display_name"].isin({list_name, export_list_name}))
            & df["field_internal_name_for_create"].isin(fields)
        ].copy()

        existing = set(subset["field_internal_name_for_create"])
        for missing in sorted(fields - existing):
            used_rows.append({
                "lista": list_name,
                "nombre_visual": "",
                "nombre_interno": missing,
                "tipo_sharepoint": "",
                "obligatorio_sharepoint": "",
                "valor_defecto": "",
                "opciones": "",
                "estado": "NO_ENCONTRADO_EN_EXPORT",
            })

        for _, row in subset.iterrows():
            used_rows.append({
                "lista": row["list_display_name"],
                "nombre_visual": row["field_display_name"],
                "nombre_interno": row["field_internal_name_for_create"],
                "tipo_sharepoint": row["type"],
                "obligatorio_sharepoint": row["required"],
                "valor_defecto": row["default_value"],
                "opciones": row["choices"],
                "estado": "USADO",
            })

    used = pd.DataFrame(used_rows)
    used = used.sort_values(["lista", "estado", "nombre_interno"], na_position="last")
    used.to_csv(OUT_USED_CSV, index=False, encoding="utf-8-sig")
    return [row for row in used_rows if row["estado"] == "NO_ENCONTRADO_EN_EXPORT"]


if __name__ == "__main__":
    export_fields()
