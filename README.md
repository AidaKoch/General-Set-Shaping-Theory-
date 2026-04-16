# Set Shaping Mapper

Author: Aida Koch

Static application for building a correspondence table inspired by Set Shaping Theory.

## What it computes

1. Generates all source sequences `A^N`.
2. Computes the empirical entropy `H0(s)` of each sequence from symbol frequencies.
3. Sorts source sequences by `N * H0(s)`.
4. Generates all expanded sequences `A^(N+K)`.
5. Sorts expanded sequences by `(N+K) * H0(s)`.
6. Selects the first `A^N` expanded sequences, meaning the sequences with the lowest values.
7. Matches the ordered source sequences with the ordered expanded sequences and creates an Excel-compatible `.xls` file.

## Usage

Open `index.html` in the browser and enter:

- `Alphabet A`, for example `0,1` or `A,B,C`;
- `Length N`;
- `Parameter K`;
- `Computation limit`, the maximum number of expanded sequences allowed.

Then press **Compute mapping** and download the Excel file.

## Limit note

The number of sequences grows exponentially. With a binary alphabet:

- `N=10`, `K=4` generates `2^14 = 16384` expanded sequences;
- `N=16`, `K=4` generates `2^20 = 1048576` expanded sequences, so it can become slow.

To avoid browser freezes, the app stops the computation when `A^(N+K)` exceeds the selected limit.
