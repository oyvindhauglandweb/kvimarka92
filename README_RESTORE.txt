Arrangementer – komplett siste versjon

Denne pakken er satt sammen fra de siste fungerende Arrangement-versjonene i denne tråden.

FILER
=====

1) arrangementer.html
   Versjon: V483
   Inneholder blant annet:
   - Hjelp-knapp
   - 31 dagers historikkvisning
   - start på I DAG
   - favoritter og "alle favoritter"
   - filterknapp
   - stabil meny ved bakoverscroll/historikk
   - mobilmeny på én rad i Safari og standalone

2) scripts/run-arrangementer-import.mjs
   Versjon: V474
   - bygger arrangementer-data.json med siste 31 dager + fremtid
   - bruker sluttid som historikkreferanse når den finnes

3) scripts/arrangementer-engine.mjs
   Versjon: V491
   - beholder ferdige arrangementer i 31 dager
   - cleanup sletter først etter historikkperioden

INSTALLASJON
============
Erstatt filene i repoet på nøyaktig disse plasseringene.

Etter opplasting:
- Commit/push
- Kjør GitHub Action: Arrangementer import
- Kontroller at arrangementer-data.json igjen inneholder historiske datoer

VIKTIG
=======
Workflowen bruker:
  scripts/run-arrangementer-import.mjs

Runneren bruker:
  scripts/arrangementer-engine.mjs

Repo-root arrangementer-engine.mjs er ikke den aktive engine-filen for workflowen.
