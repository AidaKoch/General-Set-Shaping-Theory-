# Set Shaping Mapper

Applicazione statica per costruire una tabella di corrispondenza ispirata alla set shaping theory.

## Cosa calcola

1. Genera tutte le sequenze iniziali `A^N`.
2. Per ogni sequenza calcola l'entropia empirica `H0(s)` usando le frequenze dei simboli.
3. Ordina le sequenze iniziali in base a `N * H0(s)`.
4. Genera tutte le sequenze espanse `A^(N+K)`.
5. Ordina le sequenze espanse in base a `(N+K) * H0(s)`.
6. Seleziona le prime `A^N` sequenze espanse, cioe quelle con valore piu basso.
7. Abbina le sequenze iniziali ordinate alle sequenze espanse ordinate e crea un file Excel `.xls`.

## Uso

Apri `index.html` nel browser, inserisci:

- `Alfabeto A`, per esempio `0,1` oppure `A,B,C`;
- `Lunghezza N`;
- `Parametro K`;
- `Limite calcolo`, cioe il massimo numero di sequenze espanse consentito.

Poi premi **Calcola mapping** e scarica il file Excel.

## Nota sui limiti

Il numero di sequenze cresce esponenzialmente. Con alfabeto binario:

- `N=10`, `K=4` genera `2^14 = 16384` sequenze espanse;
- `N=16`, `K=4` genera `2^20 = 1048576` sequenze espanse, quindi puo diventare lento.

Per evitare blocchi del browser, l'app interrompe il calcolo quando `A^(N+K)` supera il limite impostato.
