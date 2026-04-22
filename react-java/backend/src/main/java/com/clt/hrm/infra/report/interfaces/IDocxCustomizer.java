package com.clt.hrm.infra.report.interfaces;

import org.docx4j.openpackaging.packages.WordprocessingMLPackage;
import org.docx4j.openpackaging.parts.WordprocessingML.MainDocumentPart;

import java.util.Map;

@FunctionalInterface
public interface IDocxCustomizer {
    void customize(WordprocessingMLPackage pkg, MainDocumentPart docPart, Map<String, Object> rawParams) throws Exception;
}