package com.clt.hrm.infra.utils;

import java.nio.file.Files;
import java.net.URL;
import org.apache.xmlgraphics.image.loader.ImageInfo;
import org.apache.xmlgraphics.image.loader.ImageManager;
import org.apache.xmlgraphics.image.loader.impl.DefaultImageContext;
import org.apache.xmlgraphics.image.loader.impl.DefaultImageSessionContext;

import org.docx4j.openpackaging.packages.WordprocessingMLPackage;
import org.docx4j.openpackaging.parts.WordprocessingML.BinaryPartAbstractImage;
import org.docx4j.openpackaging.parts.WordprocessingML.MainDocumentPart;
import org.docx4j.org.apache.poi.poifs.property.Child;
import org.docx4j.wml.*;

import com.clt.hrm.infra.file.dtos.FileDto;
import com.clt.hrm.infra.file.dtos.SearchFileDto;
import com.clt.hrm.infra.report.dtos.ImagePlaceHolderDto;

import org.docx4j.XmlUtils;
import org.docx4j.dml.wordprocessingDrawing.Inline;
import org.docx4j.TraversalUtil;
import org.docx4j.TraversalUtil.CallbackImpl;

import jakarta.xml.bind.JAXBElement;

import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import javax.imageio.ImageIO;

import lombok.extern.slf4j.Slf4j;

@Slf4j
public class ReportUtils {
    /**
     * Find a table row containing an SDT with the specified tag.
     * Searches for SDTs at multiple levels: SdtBlock, SdtCell, and SdtRun.
     */
    public static Tr findRowBySDTTag(MainDocumentPart mainDocumentPart, String tag) {
        final Tr[] result = new Tr[1];
    
        new TraversalUtil(mainDocumentPart.getContent(), new TraversalUtil.CallbackImpl() {
            @Override
            public List<Object> apply(Object o) {
                // Check if this is a table row
                if (o instanceof Tr && result[0] == null) {
                    Tr row = (Tr) o;
                    if (rowContainsSDTWithTag(row, tag)) {
                        result[0] = row;
                        return null;
                    }
                }
                
                // Check if an SdtBlock contains a table row with the tag
                if (o instanceof SdtBlock && result[0] == null) {
                    SdtBlock sdt = (SdtBlock) o;
                    if (checkSDTTag(sdt, tag)) {
                        // The row is INSIDE sdtContent
                        for (Object content : sdt.getSdtContent().getContent()) {
                            if (content instanceof Tr) {
                                result[0] = (Tr) content;
                                return null;
                            }
                        }
                    }
                }
                
                return null;
            }
        });
    
        return result[0];
    }
    
    /**
     * Check if an SDT element has a specific tag.
     */
    private static boolean checkSDTTag(SdtElement sdt, String tag) {
        if (sdt.getSdtPr() != null && sdt.getSdtPr().getTag() != null) {
            return tag.equals(sdt.getSdtPr().getTag().getVal());
        }
        return false;
    }

    /**
     * Helper method to check if a row contains an SDT with specific tag.
     * Checks for any SDT type within the row (SdtRun, SdtBlock, etc.).
     */
    private static boolean rowContainsSDTWithTag(Tr row, String tag) {
        final boolean[] found = new boolean[1];
        
        new TraversalUtil(row.getContent(), new CallbackImpl() {
            @Override
            public List<Object> apply(Object o) {
                // Check for any type of SDT element (covers SdtRun, SdtBlock, etc.)
                if (o instanceof SdtElement) {
                    SdtElement sdt = (SdtElement) o;
                    if (checkSDTTag(sdt, tag)) {
                        found[0] = true;
                        return null; // Stop traversal once found
                    }
                }
                return null;
            }
        });
        return found[0];
    }

    /**

    /**
     * Get the parent table (Tbl) containing a specific row.
     * 
     * @param mainDocumentPart The main document part to search
     * @param row The row to find the parent table for
     * @return The parent table, or null if not found
     */
    public static Tbl getParentTable(MainDocumentPart mainDocumentPart, Tr row) {
        final Tbl[] result = new Tbl[1];
        
        new TraversalUtil(mainDocumentPart.getContent(), new CallbackImpl() {
            @Override
            public List<Object> apply(Object o) {
                if (o instanceof Tbl) {
                    Tbl table = (Tbl) o;
                    if (containsRow(table, row)) {
                        result[0] = table;
                    }
                }
                return null;
            }
        });
        
        return result[0];
    }

    /**
     * Check if a table contains a specific row.
     * 
     * @param table The table to search
     * @param targetRow The row to search for
     * @return true if the table contains the row, false otherwise
     */
    private static boolean containsRow(Tbl table, Tr targetRow) {
        for (Object obj : table.getContent()) {
            if (obj.equals(targetRow)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Replace a placeholder in a table row with a value.
     * Handles multiple occurrences of the placeholder.
     * 
     * @param row The table row to search
     * @param placeholder The placeholder to replace (e.g., "${id}")
     * @param value The value to replace with (null will be replaced with empty string)
     */
    public static void replacePlaceholder(Tr row, String placeholder, String value) {
        //mergeAdjacentTexts(row);
        List<Object> textElements = getAllElementFromObject(row, Text.class);
        
        for (Object obj : textElements) {
            Text text = (Text) obj;
            String textValue = text.getValue();
            
            if (textValue != null && textValue.contains(placeholder)) {
                text.setValue(textValue.replace(placeholder, value != null ? value : ""));
            }
        }
    }

    private static void mergeAdjacentTexts(Tr row) {
        List<Object> runs = getAllElementFromObject(row, R.class);
        
        for (Object runObj : runs) {
            R run = (R) runObj;
            List<Object> content = run.getContent();
            
            // Merge consecutive Text elements
            for (int i = content.size() - 1; i > 0; i--) {
                Object current = content.get(i);
                Object previous = content.get(i - 1);
                
                if (current instanceof JAXBElement && previous instanceof JAXBElement) {
                    JAXBElement<?> currentEl = (JAXBElement<?>) current;
                    JAXBElement<?> previousEl = (JAXBElement<?>) previous;
                    
                    if (currentEl.getValue() instanceof Text && previousEl.getValue() instanceof Text) {
                        Text currentText = (Text) currentEl.getValue();
                        Text previousText = (Text) previousEl.getValue();
                        
                        // Merge the texts
                        previousText.setValue(previousText.getValue() + currentText.getValue());
                        content.remove(i);
                    }
                }
            }
        }
    }

    public static void replaceImagePlaceholder(
        Tc cell,
        FileDto imageFile,
        WordprocessingMLPackage wordMLPackage,
        MainDocumentPart documentPart,
        ImagePlaceHolderDto imageInfo,
        String placeholder
    ) throws Exception {
        if (wordMLPackage == null || documentPart == null) return;
        if (imageInfo == null || !imageInfo.found) return;

        if (imageFile == null) return;

        File imageFileObj = new File(imageFile.getFilePath());
        if (!imageFileObj.exists()) return;

        BufferedImage bufferedImage = ImageIO.read(imageFileObj);
        if (bufferedImage == null) return;

        int targetWidth = imageInfo.width > 0 ? imageInfo.width : bufferedImage.getWidth();
        int targetHeight = imageInfo.height > 0 ? imageInfo.height : bufferedImage.getHeight();

        if (targetWidth != bufferedImage.getWidth() || targetHeight != bufferedImage.getHeight()) {
            java.awt.Image scaledImage = bufferedImage.getScaledInstance(targetWidth, targetHeight, java.awt.Image.SCALE_SMOOTH);
            BufferedImage resizedImage = new BufferedImage(targetWidth, targetHeight, BufferedImage.TYPE_INT_RGB);
            java.awt.Graphics2D g2d = resizedImage.createGraphics();
            g2d.drawImage(scaledImage, 0, 0, null);
            g2d.dispose();
            bufferedImage = resizedImage;
        }

        ByteArrayOutputStream imageOut = new ByteArrayOutputStream();
        ImageIO.write(bufferedImage, "png", imageOut);
        byte[] imageBytes = imageOut.toByteArray();

        Inline placeholderInline = ReportUtils.getPlaceholderInlineInCell(cell, placeholder);
        if (placeholderInline == null) return;

        long[] existingExtent = getInlineExtentEmu(placeholderInline);

        BinaryPartAbstractImage imagePart = BinaryPartAbstractImage.createImagePart(wordMLPackage, documentPart, imageBytes, "image/png");
        
        // createImageInline() needs imageInfo for dimensions; the 4-arg createImagePart does not set it
        File tmpPng = File.createTempFile("docximg", ".png");
        try {
            Files.write(tmpPng.toPath(), imageBytes);
            URL url = tmpPng.toURI().toURL();
            ImageManager imageManager = new ImageManager(new DefaultImageContext());
            ImageInfo info = imageManager.getImageInfo(url.toString(), new DefaultImageSessionContext(new DefaultImageContext(), null));
            imagePart.setImageInfo(info);
        } finally {
            tmpPng.delete();
        }
        
        Inline newInline = imagePart.createImageInline(null, placeholder, 1, 1, false, 1);

        Object newGraphic = getInlineGraphic(newInline);
        if (newGraphic != null) setInlineGraphic(placeholderInline, newGraphic);

        if (existingExtent != null) {
            ReportUtils.setInlineExtentEmu(placeholderInline, existingExtent[0], existingExtent[1]);
        } else {
            long widthEmu = targetWidth * 9525L;
            long heightEmu = targetHeight * 9525L;
            ReportUtils.setInlineExtentEmu(placeholderInline, widthEmu, heightEmu);
        }
    }

    private static void setInlineExtentEmu(Inline inline, long cx, long cy) {
        try {
            Object extent = inline.getClass().getMethod("getExtent").invoke(inline);
            if (extent == null) return;
            extent.getClass().getMethod("setCx", long.class).invoke(extent, cx);
            extent.getClass().getMethod("setCy", long.class).invoke(extent, cy);
        } catch (Exception ignored) {
        }
    }

    private static Inline getPlaceholderInlineInCell(Tc cell, String placeholder) {
        final Inline[] found = new Inline[1];
        new TraversalUtil(cell.getContent(), new CallbackImpl() {
            @Override
            public List<Object> apply(Object o) {
                if (o instanceof Drawing) {
                    Drawing drawing = (Drawing) o;
                    String altText = getAltTextFromDrawing(drawing);
                    if (placeholder.equals(altText) && found[0] == null) {
                        found[0] = getFirstInlineFromDrawing(drawing);
                    }
                }
                return null;
            }
        });
        return found[0];
    }

    private static Object getInlineGraphic(Inline inline) {
        try {
            Method m = inline.getClass().getMethod("getGraphic");
            return m.invoke(inline);
        } catch (Exception e) {
            return null;
        }
    }

    private static void setInlineGraphic(Inline inline, Object graphic) {
        if (inline == null || graphic == null) return;
        try {
            Method m;
            try {
                m = inline.getClass().getMethod("setGraphic", graphic.getClass());
            } catch (NoSuchMethodException e) {
                for (Method mm : inline.getClass().getMethods()) {
                    if ("setGraphic".equals(mm.getName()) && mm.getParameterCount() == 1) {
                        m = mm;
                        m.invoke(inline, graphic);
                        return;
                    }
                }
                return;
            }
            m.invoke(inline, graphic);
        } catch (Exception ignored) {
        }
    }



    /**
     * Recursively get all elements of a specific class from an object.
     * 
     * @param obj The object to search
     * @param toSearch The class to search for
     * @return List of all matching elements
     */
    private static List<Object> getAllElementFromObject(Object obj, Class<?> toSearch) {
        List<Object> result = new ArrayList<>();
        
        if (obj instanceof JAXBElement) {
            obj = ((JAXBElement<?>) obj).getValue();
        }
        
        if (obj.getClass().equals(toSearch)) {
            result.add(obj);
        } else if (obj instanceof ContentAccessor) {
            List<?> children = ((ContentAccessor) obj).getContent();
            for (Object child : children) {
                result.addAll(getAllElementFromObject(child, toSearch));
            }
        }
        return result;
    }

    /**
     * Debug utility to list all SDT (Structured Document Tag) elements in a document.
     * Useful for discovering available tags when building document templates.
     *
     * @param mainDocumentPart The main document part to scan
     */
    public static void debugListAllSDTs(MainDocumentPart mainDocumentPart) {
        System.out.println("=== DEBUG: Scanning document for all SDT elements ===");

        final int[] count = {0};

        new TraversalUtil(mainDocumentPart.getContent(), new TraversalUtil.CallbackImpl() {
            @Override
            public List<Object> apply(Object o) {
                if (o instanceof SdtElement sdt) {
                    count[0]++;
                    String sdtType = sdt.getClass().getSimpleName();
                    String tag = "(no tag)";
                    String alias = "(no alias)";

                    SdtPr sdtPr = sdt.getSdtPr();
                    if (sdtPr != null) {
                        if (sdtPr.getTag() != null) {
                            tag = sdtPr.getTag().getVal();
                        }
                        alias = extractAlias(sdtPr);
                    }

                    System.out.printf("  [%d] %s - Tag: '%s', Alias: '%s'%n",
                            count[0], sdtType, tag, alias);
                }
                return null;
            }
        });

        System.out.printf("=== END SDT Scan (Total: %d) ===%n", count[0]);
    }

    /**
     * Extract the alias value from SdtPr by searching through its properties list.
     *
     * @param sdtPr The SDT properties object
     * @return The alias value, or "(no alias)" if not found
     */
    private static String extractAlias(SdtPr sdtPr) {
        if (sdtPr == null || sdtPr.getRPrOrAliasOrLock() == null) {
            return "(no alias)";
        }

        for (Object item : sdtPr.getRPrOrAliasOrLock()) {
            Object value = item;
            if (item instanceof JAXBElement<?>) {
                value = ((JAXBElement<?>) item).getValue();
            }
            if (value instanceof SdtPr.Alias) {
                return ((SdtPr.Alias) value).getVal();
            }
        }
        return "(no alias)";
    }

    /**
     * Process a list of objects to fill a table by cloning a template row.
     * The template row is identified by an SDT tag (e.g., "employeeList").
     * Each map in the list contains placeholder keys and their values.
     *
     * @param mainDocumentPart The main document part containing the table
     * @param tag              The SDT tag identifying the template row (e.g., "employeeList")
     * @param dataList         List of maps where each map contains placeholder-value pairs
     *                         (e.g., [{"employeeId": "001", "employeeName": "John", "position": "Dev"}, ...])
     */
    public static void processListObjects(MainDocumentPart mainDocumentPart, String tag, List<Map<String, Object>> dataList) {
        if (dataList == null || dataList.isEmpty()) {
            return;
        }

        // Find the SDT row element with the specified tag
        SdtElement sdtRow = findSdtElementByTag(mainDocumentPart, tag);
        if (sdtRow == null) {
            System.out.println("WARNING: SDT with tag '" + tag + "' not found");
            return;
        }

        // Get the template row from the SDT content
        Tr templateRow = extractTemplateRow(sdtRow);
        if (templateRow == null) {
            System.out.println("WARNING: No template row found inside SDT with tag '" + tag + "'");
            return;
        }

        // Find the parent table containing this SDT
        Tbl parentTable = findParentTable(mainDocumentPart, sdtRow);
        if (parentTable == null) {
            System.out.println("WARNING: Parent table not found for SDT with tag '" + tag + "'");
            return;
        }

        // Find the index of the SDT row in the table
        int sdtIndex = findElementIndex(parentTable.getContent(), sdtRow);
        if (sdtIndex == -1) {
            System.out.println("WARNING: SDT element not found in parent table content");
            return;
        }

        // Clone and fill rows for each data item
        List<Tr> newRows = new ArrayList<>();
        for (Map<String, Object> data : dataList) {
            Tr clonedRow = XmlUtils.deepCopy(templateRow);
            fillRowWithData(clonedRow, data);
            newRows.add(clonedRow);
        }

        // Remove the original SDT row from the table
        parentTable.getContent().remove(sdtIndex);

        // Insert all new rows at the same position
        for (int i = newRows.size() - 1; i >= 0; i--) {
            parentTable.getContent().add(sdtIndex, newRows.get(i));
        }

        System.out.println("INFO: Processed '" + tag + "' - added " + newRows.size() + " rows");
    }

    /**
     * Find a table row containing a specific text marker.
     * 
     * <p>Searches through all table rows in the document to find one that contains the marker text.
     * The marker text may be split across multiple Text elements, so all text in the row is merged before searching.
     * 
     * @param mainDocumentPart The document part to search
     * @param markerText The text marker to find (e.g., "<!--experiencesList-->")
     * @return The table row containing the marker, or null if not found
     */
    private static Tr findRowByTextMarker(MainDocumentPart mainDocumentPart, String markerText) {
        final Tr[] result = new Tr[1];
        
        new TraversalUtil(mainDocumentPart.getContent(), new CallbackImpl() {
            @Override
            public List<Object> apply(Object o) {
                if (o instanceof Tr row && result[0] == null) {
                    if (rowContainsText(row, markerText)) {
                        result[0] = row;
                        return null;
                    }
                }
                return null;
            }
        });
        
        return result[0];
    }

    /**
     * Check if a row contains specific text.
     * 
     * <p>Merges all text elements in the row to handle cases where text is split across multiple Text elements.
     * This is necessary because Word may split text across multiple Text nodes.
     * 
     * @param row The table row to search
     * @param searchText The text to search for
     * @return true if the row contains the search text, false otherwise
     */
    private static boolean rowContainsText(Tr row, String searchText) {
        // Get all text elements from the row
        List<Object> textElements = getAllElementFromObject(row, Text.class);
        
        // Merge all text to handle cases where marker might be split across multiple Text elements
        StringBuilder mergedText = new StringBuilder();
        for (Object obj : textElements) {
            Text text = (Text) obj;
            if (text.getValue() != null) {
                mergedText.append(text.getValue());
            }
        }
        
        // Check if merged text contains the search text
        return mergedText.toString().contains(searchText);
    }

    /**
     * Find the parent table containing a given row.
     * 
     * @param mainDocumentPart The document part to search
     * @param targetRow The table row to find the parent for
     * @return The parent table, or null if not found
     */
    private static Tbl findParentTableForRow(MainDocumentPart mainDocumentPart, Tr targetRow) {
        final Tbl[] result = new Tbl[1];
        
        new TraversalUtil(mainDocumentPart.getContent(), new CallbackImpl() {
            @Override
            public List<Object> apply(Object o) {
                if (o instanceof Tbl table && result[0] == null) {
                    if (tableContainsRow(table, targetRow)) {
                        result[0] = table;
                    }
                }
                return null;
            }
        });
        
        return result[0];
    }

    /**
     * Check if a table contains a specific row.
     * 
     * @param table The table to search
     * @param targetRow The row to find
     * @return true if the table contains the row, false otherwise
     */
    private static boolean tableContainsRow(Tbl table, Tr targetRow) {
        for (Object obj : table.getContent()) {
            Object row = obj;
            if (obj instanceof JAXBElement) {
                row = ((JAXBElement<?>) obj).getValue();
            }
            if (row == targetRow || row.equals(targetRow)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Find the index of a row in a table.
     * 
     * <p>Handles JAXBElement wrappers that may wrap the row object.
     * 
     * @param table The table to search
     * @param targetRow The row to find the index for
     * @return The index of the row, or -1 if not found
     */
    private static int findRowIndexInTable(Tbl table, Tr targetRow) {
        List<Object> content = table.getContent();
        for (int i = 0; i < content.size(); i++) {
            Object obj = content.get(i);
            Object row = obj;
            if (obj instanceof JAXBElement) {
                row = ((JAXBElement<?>) obj).getValue();
            }
            if (row == targetRow || row.equals(targetRow)) {
                return i;
            }
        }
        return -1;
    }

    /**
     * Remove the text marker from a row (clean up the template).
     * 
     * <p>After finding the template row by marker, this method removes the marker text
     * so it doesn't appear in the final document.
     * 
     * @param row The row to clean
     * @param markerText The marker text to remove
     */
    private static void removeTextMarkerFromRow(Tr row, String markerText) {
        List<Object> textElements = getAllElementFromObject(row, Text.class);
        for (Object obj : textElements) {
            Text text = (Text) obj;
            if (text.getValue() != null && text.getValue().contains(markerText)) {
                String newValue = text.getValue().replace(markerText, "").trim();
                text.setValue(newValue);
            }
        }
    }

    /**
     * Add a page break to a document part.
     * 
     * @param documentPart The document part to add the page break to
     */
    public static void addPageBreak(MainDocumentPart documentPart) {
        ObjectFactory factory = new ObjectFactory();
        P paragraph = factory.createP();
        R run = factory.createR();
        Br breakElement = factory.createBr();
        breakElement.setType(STBrType.PAGE);
        run.getContent().add(breakElement);
        paragraph.getContent().add(run);
        documentPart.getContent().add(paragraph);
    }

    /**
     * docx4j {@code variableReplace} writes newline characters as literal text inside {@code w:t};
     * Word does not render them as line breaks. This walks all runs and replaces {@code \n}/{@code \r\n}
     * with {@code w:br} plus separate text runs (same paragraph).
     */
    public static void expandNewlinesToLineBreaksInParagraphs(MainDocumentPart documentPart) {
        ObjectFactory factory = new ObjectFactory();
        new TraversalUtil(documentPart.getContent(), new CallbackImpl() {
            @Override
            public List<Object> apply(Object o) {
                Object v = o instanceof JAXBElement<?> j ? j.getValue() : o;
                if (v instanceof P p) {
                    expandNewlinesInParagraphRuns(p, factory);
                }
                return null;
            }
        });
    }

    private static void expandNewlinesInParagraphRuns(P p, ObjectFactory factory) {
        for (Object child : new ArrayList<>(p.getContent())) {
            Object v = child instanceof JAXBElement<?> j ? j.getValue() : child;
            if (v instanceof R run) {
                expandNewlinesInSingleRun(run, factory);
            }
        }
    }

    private static void expandNewlinesInSingleRun(R run, ObjectFactory factory) {
        boolean changed = false;
        List<Object> original = new ArrayList<>(run.getContent());
        List<Object> expanded = new ArrayList<>();
        for (Object o : original) {
            Object x = o instanceof JAXBElement<?> j ? j.getValue() : o;
            if (x instanceof Text t && t.getValue() != null
                    && (t.getValue().indexOf('\n') >= 0 || t.getValue().indexOf('\r') >= 0)) {
                changed = true;
                String normalized = t.getValue().replace("\r\n", "\n").replace("\r", "\n");
                String[] parts = normalized.split("\n", -1);
                for (int i = 0; i < parts.length; i++) {
                    if (i > 0) {
                        expanded.add(factory.createBr());
                    }
                    if (!parts[i].isEmpty()) {
                        Text nt = factory.createText();
                        nt.setValue(parts[i]);
                        expanded.add(nt);
                    }
                }
            } else {
                expanded.add(o);
            }
        }
        if (!changed) {
            return;
        }
        run.getContent().clear();
        run.getContent().addAll(expanded);
    }

    /**
     * Find an SDT element by its tag value.
     */
    private static SdtElement findSdtElementByTag(MainDocumentPart mainDocumentPart, String tag) {
        final SdtElement[] result = new SdtElement[1];
        new TraversalUtil(mainDocumentPart.getContent(), new CallbackImpl() {
            @Override
            public List<Object> apply(Object o) {
                if (o instanceof SdtElement sdt && result[0] == null) {
                    if (checkSDTTag(sdt, tag)) {
                        result[0] = sdt;
                    }
                }
                return null;
            }
        });
        return result[0];
    }

    /**
     * Extract the template row from an SDT element.
     * Handles both CTSdtRow (row-level SDT) and SdtBlock (block-level SDT containing a row).
     */
    private static Tr extractTemplateRow(SdtElement sdtElement) {
        if (sdtElement instanceof CTSdtRow sdtRow) {
            // CTSdtRow contains the row directly in its content
            for (Object content : sdtRow.getSdtContent().getContent()) {
                if (content instanceof Tr) {
                    return (Tr) content;
                }
            }
        } else if (sdtElement instanceof SdtBlock sdtBlock) {
            // SdtBlock might contain a row
            for (Object content : sdtBlock.getSdtContent().getContent()) {
                if (content instanceof Tr) {
                    return (Tr) content;
                }
            }
        }
        return null;
    }

    /**
     * Find the parent table containing an SDT element.
     */
    private static Tbl findParentTable(MainDocumentPart mainDocumentPart, SdtElement targetSdt) {
        final Tbl[] result = new Tbl[1];

        new TraversalUtil(mainDocumentPart.getContent(), new CallbackImpl() {
            @Override
            public List<Object> apply(Object o) {
                if (o instanceof Tbl table) {
                    if (tableContainsSdt(table, targetSdt)) {
                        result[0] = table;
                    }
                }
                return null;
            }
        });

        return result[0];
    }

    /**
     * Check if a table contains a specific SDT element.
     */
    private static boolean tableContainsSdt(Tbl table, SdtElement targetSdt) {
        for (Object obj : table.getContent()) {
            if (obj == targetSdt) {
                return true;
            }
            // Also check JAXBElement wrappers
            if (obj instanceof JAXBElement<?> jaxbElement) {
                if (jaxbElement.getValue() == targetSdt) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Find the template table in a document part. Return the first table found.
     * 
     * @param documentPart The document part to search
     * @return The template table, or null if not found
     */
    public static Tbl findTemplateTable(MainDocumentPart documentPart) {
        final Tbl[] result = new Tbl[1];
        new TraversalUtil(documentPart.getContent(), new CallbackImpl() {
            @Override
            public List<Object> apply(Object o) {
                Object obj = o;
                if (o instanceof JAXBElement) {
                    obj = ((JAXBElement<?>) o).getValue();
                }
                if (obj instanceof Tbl && result[0] == null) {
                    result[0] = (Tbl) obj;
                    return null;
                }
                return null;
            }
        });
        return result[0];
    }

    /**
     * Find the image placeholder in a cell with the specified placeholder. Return the first image placeholder found.
     * 
     * @param cell The cell to search
     * @return The image placeholder info, or null if not found
     */
    public static ImagePlaceHolderDto findImagePlaceholder(Tc cell, String placeholder) {
        ImagePlaceHolderDto info = new ImagePlaceHolderDto();
        new TraversalUtil(cell.getContent(), new CallbackImpl() {
            @Override
            public List<Object> apply(Object o) {
                if (o instanceof Drawing) {
                    Drawing drawing = (Drawing) o;
                    String altText = ReportUtils.getAltTextFromDrawing(drawing);
                    if (placeholder.equals(altText)) {
                        info.found = true;
                        ReportUtils.extractImageDimensions(drawing, info);
                    }
                }
                return null;
            }
        });
        return info;
    }

    /**
     * Get the alt text from a drawing.
     * 
     * @param drawing The drawing to search
     * @return The alt text, or null if not found
     */
    private static String getAltTextFromDrawing(Drawing drawing) {
        try {
            Inline inline = getFirstInlineFromDrawing(drawing);
            if (inline == null) return null;
            return getInlineAltText(inline);
        } catch (Exception e) {
            log.warn("[EmployeeTimeCardReportService][getAltTextFromDrawing] {}", e.getMessage());
            return null;
        }
    }
    

    /**
     * Extract the image dimensions from a drawing.
     * 
     * @param drawing The drawing to search
     * @param info The image placeholder info to fill
     */
    private static void extractImageDimensions(Drawing drawing, ImagePlaceHolderDto info) {
        try {
            Inline inline = ReportUtils.getFirstInlineFromDrawing(drawing);
            if (inline == null) return;
            long[] extent = ReportUtils.getInlineExtentEmu(inline);
            if (extent == null) return;
            info.width = (int) (extent[0] / 9525);
            info.height = (int) (extent[1] / 9525);
        } catch (Exception e) {
            log.warn("[EmployeeTimeCardReportService][extractImageDimensions] {}", e.getMessage());
        }
    }

    /**
     * Get the first inline from a drawing.
     * 
     * @param drawing The drawing to search
     * @return The first inline, or null if not found
     */
    private static Inline getFirstInlineFromDrawing(Drawing drawing) {
        if (drawing == null) return null;
        List<Object> anchorOrInline = drawing.getAnchorOrInline();
        if (anchorOrInline == null) return null;
        for (Object obj : anchorOrInline) {
            Object value = obj;
            if (value instanceof JAXBElement) value = ((JAXBElement<?>) value).getValue();
            if (value instanceof Inline) return (Inline) value;
        }
        return null;
    }

    /**
     * Get the alt text from an inline.
     * 
     * @param inline The inline to search
     * @return The alt text, or null if not found
     */
    private static String getInlineAltText(Inline inline) {
        try {
            Object docPr = inline.getClass().getMethod("getDocPr").invoke(inline);
            if (docPr == null) return null;

            try {
                Object descr = docPr.getClass().getMethod("getDescr").invoke(docPr);
                if (descr instanceof String && !((String) descr).isBlank()) return (String) descr;
            } catch (NoSuchMethodException ignored) {
            }

            try {
                Object name = docPr.getClass().getMethod("getName").invoke(docPr);
                if (name instanceof String && !((String) name).isBlank()) return (String) name;
            } catch (NoSuchMethodException ignored) {
            }

            try {
                Object title = docPr.getClass().getMethod("getTitle").invoke(docPr);
                if (title instanceof String && !((String) title).isBlank()) return (String) title;
            } catch (NoSuchMethodException ignored) {
            }
        } catch (Exception e) {
            log.warn("[EmployeeTimeCardReportService][getInlineAltText] {}", e.getMessage());
        }
        return null;
    }

    /**
     * Get the extent of an inline in emu.
     * 
     * @param inline The inline to search
     * @return The extent in emu, or null if not found
     */
    private static long[] getInlineExtentEmu(Inline inline) {
        try {
            Object extent = inline.getClass().getMethod("getExtent").invoke(inline);
            if (extent == null) return null;
            Object cxObj = extent.getClass().getMethod("getCx").invoke(extent);
            Object cyObj = extent.getClass().getMethod("getCy").invoke(extent);
            long cx = cxObj instanceof Number ? ((Number) cxObj).longValue() : 0L;
            long cy = cyObj instanceof Number ? ((Number) cyObj).longValue() : 0L;
            if (cx <= 0 || cy <= 0) return null;
            return new long[]{cx, cy};
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * Find the index of an element in a list (handles JAXBElement wrappers).
     */
    private static int findElementIndex(List<Object> content, Object target) {
        for (int i = 0; i < content.size(); i++) {
            Object obj = content.get(i);
            if (obj == target) {
                return i;
            }
            if (obj instanceof JAXBElement<?> jaxbElement) {
                if (jaxbElement.getValue() == target) {
                    return i;
                }
            }
        }
        return -1;
    }

    /**
     * Replace a placeholder in a text with a value.
     * 
     * @param text The text to search
     * @param placeholder The placeholder to replace (e.g., "${id}")
     * @param value The value to replace with (null will be replaced with empty string)
     * @return The replaced text, or null if not found
     */
    public static String replacePlaceholder(String text, String placeholder, String value) {
        if (text == null || placeholder == null) return text;
        String sanitizedValue = ReportUtils.sanitizeText(value);
        return text.replace(placeholder, sanitizedValue == null ? "" : sanitizedValue);
    }

    /**
     * Sanitize text by removing or replacing problematic Unicode characters
     * that may not be supported by the font mapper.
     * 
     * @param text The text to sanitize
     * @return Sanitized text with problematic characters removed or replaced
     */
    private static String sanitizeText(String text) {
        if (text == null || text.isEmpty()) {
            return text;
        }
        StringBuilder sanitized = new StringBuilder(text.length());
        for (char c : text.toCharArray()) {
            // Remove Private Use Area characters (0xE000-0xF8FF) which includes 0xf601
            // These are often used for special symbols that fonts don't support
            if (c >= 0xE000 && c <= 0xF8FF) {
                continue; // Skip Private Use Area characters
            }
            // Keep other characters including normal Unicode ranges
            sanitized.append(c);
        }
        return sanitized.toString();
    }

    /**
     * Get all paragraphs from a cell.
     * 
     * @param cell The cell to search
     * @return The list of paragraphs, or null if not found
     */
    public static List<P> getAllParagraphsInCell(Tc cell) {
        List<P> paragraphs = new ArrayList<>();
        List<Object> cellContent = cell.getContent();
        if (cellContent == null) return paragraphs;
        for (Object obj : cellContent) {
            Object el = obj;
            if (obj instanceof JAXBElement) el = ((JAXBElement<?>) obj).getValue();
            if (el instanceof P) paragraphs.add((P) el);
        }
        return paragraphs;
    }

    /**
     * Get all cells from a table.
     * 
     * @param table The table to search
     * @return The list of cells, or null if not found
     */
    public static List<Tc> getAllCellsFromTable(Tbl table) {
        List<Tc> cells = new ArrayList<>();
        List<Object> rows = table.getContent();
        if (rows == null) return cells;
        for (Object rowObj : rows) {
            Object row = rowObj;
            if (rowObj instanceof JAXBElement) row = ((JAXBElement<?>) rowObj).getValue();
            if (!(row instanceof Tr)) continue;
            List<Object> rowCells = ((Tr) row).getContent();
            if (rowCells == null) continue;
            for (Object cellObj : rowCells) {
                Object cell = cellObj;
                if (cellObj instanceof JAXBElement) cell = ((JAXBElement<?>) cellObj).getValue();
                if (cell instanceof Tc) cells.add((Tc) cell);
            }
        }
        return cells;
    }

    /**
     * Clear a cell by setting the text value to empty.
     * 
     * @param cell The cell to clear
     * @param imageInfo The image placeholder info to clear
     * @param wordMLPackage The wordML package to clear
     */
    public static void clearCell(Tc cell, ImagePlaceHolderDto imageInfo, WordprocessingMLPackage wordMLPackage) {
        List<Text> textElements = getAllTextElements(cell);
        for (Text t : textElements) t.setValue("");
    }

    /**
     * Get all text elements from an object.
     * 
     * @param obj The object to search
     * @return The list of text elements, or null if not found
     */
    public static List<Text> getAllTextElements(Object obj) {
        List<Text> textElements = new ArrayList<>();
        ReportUtils.getAllTextElementsRecursive(obj, textElements);
        return textElements;
    }

    /**
     * Get all text elements from an object recursively.
     * 
     * @param obj The object to search
     * @param result The list of text elements to fill
     */
    private static void getAllTextElementsRecursive(Object obj, List<Text> result) {
        if (obj instanceof JAXBElement) {
            obj = ((JAXBElement<?>) obj).getValue();
        }
        if (obj instanceof Text) {
            result.add((Text) obj);
            return;
        }

        List<?> content = null;
        if (obj instanceof P) content = ((P) obj).getContent();
        else if (obj instanceof R) content = ((R) obj).getContent();
        else if (obj instanceof Tc) content = ((Tc) obj).getContent();
        else if (obj instanceof Tr) content = ((Tr) obj).getContent();
        else if (obj instanceof Tbl) content = ((Tbl) obj).getContent();
        else if (obj instanceof SdtBlock) content = ((SdtBlock) obj).getSdtContent().getContent();
        else if (obj instanceof SdtRun) content = ((SdtRun) obj).getSdtContent().getContent();

        if (content != null) {
            for (Object child : content) {
                getAllTextElementsRecursive(child, result);
            }
        }
    }

    /**
     * Fill a row with data by replacing placeholders.
     * Placeholders are in the format ${key} where key matches the map keys.
     */
    private static void fillRowWithData(Tr row, Map<String, Object> data) {
        for (Map.Entry<String, Object> entry : data.entrySet()) {
            String placeholder = entry.getKey();
            String value = entry.getValue() != null ? entry.getValue().toString() : "";
            replacePlaceholder(row, placeholder, value);
        }
    }

    /**
     * Process a list table by finding a template row (identified by marker text) and cloning it for each data item.
     * Similar to how printEmployeeTimeCard processes cells, but for table rows.
     * 
     * <p>If the list is empty or null, the template row will be removed from the document.
     * If the list has data, the template row will be cloned for each item and filled with data.
     * 
     * <p>The marker text should be placed in any cell of the template row in the DOCX template.
     * Example: Add "<!--experiencesList-->" in a cell of the template row.
     * 
     * @param docPart The document part containing the table
     * @param markerText The text marker to find the template row (e.g., "<!--experiencesList-->")
     * @param dataList List of maps containing data to fill. Each map key corresponds to a placeholder in the template (e.g., {"coNm": "Company Name"})
     */
    public static void processListTable(MainDocumentPart docPart, String markerText, List<Map<String, Object>> dataList) {
        // Find the template row containing the marker (even if list is empty, we need to remove it)
        Tr templateRow = findRowByTextMarker(docPart, markerText);
        if (templateRow == null) {
            log.warn("Template row with marker '{}' not found", markerText);
            return;
        }

        // Find the parent table
        Tbl parentTable = findParentTableForRow(docPart, templateRow);
        if (parentTable == null) {
            log.warn("Parent table not found for marker '{}'", markerText);
            return;
        }

        // Find the index of the template row (handle JAXBElement wrappers)
        int templateRowIndex = -1;
        List<Object> tableContent = parentTable.getContent();
        for (int i = 0; i < tableContent.size(); i++) {
            Object obj = tableContent.get(i);
            Object row = obj;
            if (obj instanceof JAXBElement) {
                row = ((JAXBElement<?>) obj).getValue();
            }
            if (row == templateRow || row.equals(templateRow)) {
                templateRowIndex = i;
                break;
            }
        }
        
        if (templateRowIndex == -1) {
            log.warn("Template row index not found for marker '{}'", markerText);
            return;
        }

        // If list is empty or null, just remove the template row and return
        if (dataList == null || dataList.isEmpty()) {
            Object removed = tableContent.remove(templateRowIndex);
            if (removed != null) {
                log.info("Removed empty template row for '{}' (no data)", markerText);
            } else {
                log.warn("Failed to remove template row for '{}'", markerText);
            }
            return;
        }

        // Remove the marker text from the template row
        removeTextMarkerFromRow(templateRow, markerText);

        // Clone and fill rows for each data item
        List<Tr> newRows = new ArrayList<>();
        for (Map<String, Object> data : dataList) {
            Tr clonedRow = (Tr) XmlUtils.deepCopy(templateRow);
            fillTableRowWithData(clonedRow, data);
            newRows.add(clonedRow);
        }

        // Remove the original template row
        parentTable.getContent().remove(templateRowIndex);

        // Insert all new rows at the same position
        for (int i = newRows.size() - 1; i >= 0; i--) {
            parentTable.getContent().add(templateRowIndex, newRows.get(i));
        }

        log.info("Processed list table '{}' - added {} rows", markerText, newRows.size());
    }

    /**
     * Fill a table row with data by replacing placeholders in all cells.
     * 
     * <p>This method processes each cell, finds all paragraphs and text elements, and replaces placeholders.
     * Placeholders should be in the format {key} (without $ prefix).
     * 
     * <p>Example: If the template cell contains "{coNm}", it will be replaced with the value from data.get("coNm").
     * 
     * @param row The table row to fill
     * @param data Map of placeholder keys to values (e.g., {"coNm": "Company Name", "workingPeriod": "01/01/2020 - 31/12/2020"})
     */
    public static void fillTableRowWithData(Tr row, Map<String, Object> data) {
        List<Tc> cells = getAllCellsFromRow(row);
        for (Tc cell : cells) {
            List<P> paragraphs = getAllParagraphsInCell(cell);
            for (P paragraph : paragraphs) {
                List<Text> textElements = getAllTextElements(paragraph);
                if (textElements.isEmpty()) continue;

                // Merge all text elements to get full text
                StringBuilder merged = new StringBuilder();
                for (Text t : textElements) {
                    if (t.getValue() != null) merged.append(t.getValue());
                }
                String fullText = merged.toString();
                if (fullText.isEmpty()) continue;

                // Replace all placeholders (format: {key} without $, matching printEmployeeTimeCard)
                String replaced = fullText;
                for (Map.Entry<String, Object> entry : data.entrySet()) {
                    String placeholder = "{" + entry.getKey() + "}";
                    String value = entry.getValue() != null ? entry.getValue().toString() : "";
                    replaced = replacePlaceholder(replaced, placeholder, value);
                }

                // Update the first text element and clear others
                if (!fullText.equals(replaced)) {
                    textElements.get(0).setValue(replaced);
                    for (int j = 1; j < textElements.size(); j++) {
                        textElements.get(j).setValue("");
                    }
                }
            }
        }
    }

    /**
     * Get all cells from a table row.
     * 
     * @param row The table row
     * @return List of cells
     */
    public static List<Tc> getAllCellsFromRow(Tr row) {
        List<Tc> cells = new ArrayList<>();
        List<Object> rowContent = row.getContent();
        if (rowContent == null) return cells;
        
        for (Object cellObj : rowContent) {
            Object cell = cellObj;
            if (cellObj instanceof JAXBElement) {
                cell = ((JAXBElement<?>) cellObj).getValue();
            }
            if (cell instanceof Tc) {
                cells.add((Tc) cell);
            }
        }
        return cells;
    }
}
