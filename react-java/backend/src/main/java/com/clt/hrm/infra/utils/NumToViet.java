package com.clt.hrm.infra.utils;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import org.jspecify.annotations.NonNull;

/**
 * Utility to convert numbers to words (VND) following standardized rules used in accounting and invoicing in Vietnam.
 *
 * <p>Main rules:</p>
 * <ul>
 *   <li>Read "không trăm" when hundreds = 0 but tens/units exist</li>
 *   <li>Read "lẻ" or "linh" when tens = 0 and units > 0</li>
 *   <li>Handle zero groups (thousand/million) correctly; may skip fully zero groups</li>
 *   <li>Special endings: "một"/"mốt", "bốn"/"tư", "năm"/"lăm"</li>
 *   <li>Tens = 1 → "mười"; Tens &gt; 1 → + "mươi"</li>
 * </ul>
 */
public class NumToViet {

    // Static
    private static final List<String> DIGITS = Arrays.asList(
            "không",
            "một",
            "hai",
            "ba",
            "bốn",
            "năm",
            "sáu",
            "bảy",
            "tám",
            "chín");

    private static final List<String> THOUSANDS_NGHIN = Arrays.asList(
            "",
            "nghìn",
            "triệu",
            "tỷ",
            "nghìn tỷ",
            "triệu tỷ",
            "tỷ tỷ");

    private static final List<String> THOUSANDS_NGAN = Arrays.asList(
            "",
            "ngàn",
            "triệu",
            "tỷ",
            "ngàn tỷ",
            "triệu tỷ",
            "tỷ tỷ");

    private static final List<String> BILLIONS = Arrays.asList(
            "",
            "tỷ",
            "tỷ tỷ");

    private final boolean useLe;
    private final boolean useNghin;
    private final boolean groupByBillion;

    /**
     * Default constructor with common Vietnamese number spelling conventions.
     * Uses "lẻ" for "linh" (e.g., "một trăm lẻ một"), "nghìn" for "ngàn",
     * and groups by billions for very large numbers.
     */
    public NumToViet() {
        this(true, true, true);
    }

    /**
     * Customized constructor for different Vietnamese dialects and formatting preferences.
     *
     * @param useLe          If true, use "lẻ" (Southern/General preference), otherwise use "linh" (Northern preference) for a single digit in tens' place.
     * @param useNghin       If true, use "nghìn" (Northern preference), otherwise use "ngàn" (Southern preference) for the thousand place.
     * @param groupByBillion If true, group very large numbers into "tỷ" (billion) chunks for clearer reading.
     */
    public NumToViet(boolean useLe, boolean useNghin, boolean groupByBillion) {
        this.useLe = useLe;
        this.useNghin = useNghin;
        this.groupByBillion = groupByBillion;
    }

    // Algorithm section

    /**
     * Formats a 3-digit triplet into its Vietnamese words representation.
     *
     * @param triplet         A string representing a 3-digit number (e.g., "001", "123").
     * @param showZeroHundred Whether to explicitly say "không trăm" (zero hundred).
     * @return The Vietnamese string representation of the triplet.
     */
    private String formatTriplet(String triplet, boolean showZeroHundred) {
        int hundreds = charToInt(triplet.charAt(0));
        int tens = charToInt(triplet.charAt(1));
        int units = charToInt(triplet.charAt(2));

        if (hundreds == 0) {
            // Case: 0xx
            if (tens == 0 && units == 0) {
                return "";
            }

            if (showZeroHundred) {
                return "không trăm " + formatPair(tens, units);
            }

            if (tens == 0) {
                return DIGITS.get(units);
            } else {
                return formatPair(tens, units);
            }

        }

        // Case: Hxx where H > 0
        return DIGITS.get(hundreds) + " trăm " + formatPair(tens, units);
    }

    /**
     * Formats the tens and units place of a triplet.
     * Handles Vietnamese spelling rules for 1, 4, 5 in different positions.
     *
     * @param tens  The digit in the ten-place (0-9).
     * @param units The digit in the units-place (0-9).
     * @return Vietnamese string for the last two digits.
     */
    private String formatPair(int tens, int units) {
        return switch (tens) {
            case 0 -> units == 0 ? "" : (useLe ? "lẻ " : "linh ") + DIGITS.get(units);
            case 1 -> switch (units) {
                case 0 -> "mười";
                case 5 -> "mười lăm"; // Case: 15 -> mười lăm (not mười năm)
                default -> "mười " + DIGITS.get(units);
            };
            default -> switch (units) {
                case 0 -> DIGITS.get(tens) + " mươi";
                case 1 -> DIGITS.get(tens) + " mươi mốt"; // Case: x1 (x>1) -> mươi mốt (not mươi một)
                case 4 -> DIGITS.get(tens) + " mươi tư";  // Case: x4 (x>1) -> mươi tư (often preferred over mươi bốn)
                case 5 -> DIGITS.get(tens) + " mươi lăm"; // Case: x5 (x>1) -> mươi lăm (not mươi năm)
                default -> DIGITS.get(tens) + " mươi " + DIGITS.get(units);
            };
        };
    }

    /**
     * Converts a numeric character to its integer value.
     */
    private int charToInt(int c) {
        return c - '0';
    }

    /**
     * The main entry point to format a number into Vietnamese words.
     *
     * @param num The long value to convert.
     * @return Vietnamese words representation of the number.
     */
    public @NonNull String format(long num) {
        if (num == 0L) {
            return "không";
        }

        if (num < 0L) {
            return "âm " + format(-num);
        }

        List<String> unitsName = useNghin ? THOUSANDS_NGHIN : THOUSANDS_NGAN;

        return groupByBillion ? toWordsGroupByBillion(num, unitsName) : toWordsGroupByThousand(num, unitsName);
    }

    /**
     * Formats a number by grouping it into thousands (3-digit chunks).
     *
     * @param num       The number to convert.
     * @param unitsName The list of unit names (nghìn/ngàn, triệu, tỷ, etc.).
     * @return Vietnamese words representation.
     */
    private String toWordsGroupByThousand(long num, List<String> unitsName) {
        List<String> triplets = splitIntoChunks(num, 3);

        StringBuilder result = new StringBuilder();
        for (int i = 0; i < triplets.size(); i++) {
            String triplet = triplets.get(triplets.size() - 1 - i);
            String vnString = formatTriplet(triplet, i < triplets.size() - 1).trim();
            if (!vnString.isEmpty()) {
                result.insert(0, vnString + " " + unitsName.get(i) + " ");
            } else if (!result.isEmpty()) {
                // If the triplet is 000 but there are higher-order digits, 
                // we might need to say "không trăm [unit]" depending on the position.
                result.insert(0, "không trăm " + unitsName.get(i) + " ");
            }
        }
        return result.toString().trim();
    }

    /**
     * Formats a number by grouping it into billions (9-digit chunks).
     * This makes large numbers like 1,000,000,000,000 read as "một nghìn tỷ"
     * instead of "một triệu triệu".
     *
     * @param num       The number to convert.
     * @param unitsName The list of unit names.
     * @return Vietnamese words representation.
     */
    private String toWordsGroupByBillion(long num, List<String> unitsName) {
        List<String> nonuplets = splitIntoChunks(num, 9);

        StringBuilder result = new StringBuilder();
        int nonupletCount = nonuplets.size();
        for (int i = 0; i < nonupletCount; i++) {
            String nonuple = nonuplets.get(nonupletCount - 1 - i);

            // Split into chunks of 3 digits each
            List<String> triplets = new ArrayList<>();
            for (int j = 0; j < nonuple.length(); j += 3) {
                triplets.add(nonuple.substring(j, j + 3));
            }

            StringBuilder nonupleWords = new StringBuilder();
            for (int j = 0; j < triplets.size(); j++) {
                String triplet = triplets.get(triplets.size() - 1 - j);
                boolean showZeroHundred = doShowZeroHundred(triplets, triplets.size() - 1 - j) || i < nonupletCount - 1;
                String tripletWords = formatTriplet(triplet, showZeroHundred).trim();
                if (!tripletWords.isEmpty()) {
                    nonupleWords.insert(0, tripletWords + " " + unitsName.get(j) + " ");
                } else if (showZeroHundred && !nonupleWords.isEmpty()) {
                    nonupleWords.insert(0, "không trăm " + unitsName.get(j) + " ");
                }
            }

            nonupleWords = new StringBuilder(nonupleWords.toString().trim());
            if (!nonupleWords.isEmpty()) {
                result.insert(0, nonupleWords + " " + BILLIONS.get(i) + " ");
            } else if (!result.toString().trim().isEmpty()) {
                result.insert(0, "không trăm " + BILLIONS.get(i) + " ");
            }
        }

        return result.toString().trim();
    }

    /**
     * Splits a long number into fixed-size digit chunks.
     *
     * @param number         The number to split.
     * @param digitsPerChunk Number of digits in each chunk (e.g., 3 for triplets, 9 for nonuplets).
     * @return A list of strings, each representing a chunk, padded with leading zeros.
     */
    private List<String> splitIntoChunks(long number, int digitsPerChunk) {
        String numberAsString = String.valueOf(number);

        // zero padding in front of string to prepare for splitting into digitsPerChunk-digit groups
        int requiredPaddingLength = (digitsPerChunk - (numberAsString.length() % digitsPerChunk)) % digitsPerChunk;
        if (requiredPaddingLength > 0) {
            numberAsString = "0".repeat(requiredPaddingLength) + numberAsString;
        }

        // Split into chunks of digitsPerChunk digits each
        List<String> digitChunks = new ArrayList<>();
        for (int i = 0; i < numberAsString.length(); i += digitsPerChunk) {
            digitChunks.add(numberAsString.substring(i, i + digitsPerChunk));
        }
        return digitChunks;
    }

    /**
     * Determine whether to show zero-hundred text.
     *
     * @param triplets number represented in groups of 3 digits of each 1000^n
     * @param index    current index in triplets
     * @return a boolean
     */
    private boolean doShowZeroHundred(List<String> triplets, int index) {
        for (int i = 0; i < index; i++) {
            if (!triplets.get(i).equals("000")) {
                return true;
            }
        }
        return false;
    }

}