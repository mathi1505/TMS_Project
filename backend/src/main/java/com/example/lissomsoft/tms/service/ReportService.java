package com.example.lissomsoft.tms.service;

import com.example.lissomsoft.tms.dto.ExportFileResponse;
import com.example.lissomsoft.tms.dto.ReportDailyActivityHeader;
import com.example.lissomsoft.tms.dto.ReportDailyActivityListRow;
import com.example.lissomsoft.tms.dto.ReportDailyActivityResponse;
import com.example.lissomsoft.tms.dto.ReportDailyActivityRow;
import com.example.lissomsoft.tms.dto.ReportStudentActivitySummary;
import com.example.lissomsoft.tms.dto.ReportStudentSummary;
import com.example.lissomsoft.tms.entity.StudentDet;
import com.example.lissomsoft.tms.entity.StudentMaster;
import com.example.lissomsoft.tms.entity.TrxnMaster;
import com.example.lissomsoft.tms.exception.ApiException;
import com.example.lissomsoft.tms.repository.StudentDetRepository;
import com.example.lissomsoft.tms.repository.StudentMasterRepository;
import com.example.lissomsoft.tms.repository.TrxnMasterRepository;
import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.util.Base64;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReportService {

    private final StudentMasterRepository studentMasterRepository;
    private final StudentDetRepository studentDetRepository;
    private final TrxnMasterRepository trxnMasterRepository;


    public List<ReportStudentSummary> searchStudents(String name, String studentType, Integer studentNumber) {
        return filterStudentMasters(name, studentType, studentNumber).stream()
                .map(this::toSummary)
                .collect(Collectors.toList());
    }


    private List<StudentMaster> filterStudentMasters(String name, String studentType, Integer studentNumber) {

        List<StudentMaster> all = studentMasterRepository.findAll().stream()
                .filter(s -> "A".equalsIgnoreCase(s.getDelFlag()))
                .collect(Collectors.toList());

        String nameFilter = (name == null) ? "" : name.trim().toLowerCase(Locale.ROOT);
        String typeFilter = (studentType == null) ? "" : studentType.trim().toUpperCase(Locale.ROOT);

        return all.stream()
                .filter(s -> nameFilter.isEmpty()
                        || (s.getStudentName() != null && s.getStudentName().toLowerCase(Locale.ROOT).contains(nameFilter)))
                .filter(s -> typeFilter.isEmpty() || s.getStudentId().toUpperCase(Locale.ROOT).startsWith("LS" + typeFilter))
                .filter(s -> studentNumber == null || studentNumber.equals(s.getStudentNumber()))
                .sorted(Comparator.comparing(StudentMaster::getStudentName, Comparator.nullsLast(String::compareToIgnoreCase)))
                .collect(Collectors.toList());
    }

    private ReportStudentSummary toSummary(StudentMaster s) {
        return new ReportStudentSummary(
                s.getStudentId(),
                s.getStudentNumber(),
                s.getStudentName(),
                typeCodeOf(s.getStudentId()),
                s.getJoiningDate(),
                resolveTrainerName(s.getAssignedStaff()),
                s.getMobileNo(),
                s.getEmailId(),
                s.getStdStatus()
        );
    }


    private String resolveTrainerName(String assignedStaff) {
        if (assignedStaff == null || assignedStaff.isBlank()) return "";

        String key = assignedStaff.trim();
        int dash = key.lastIndexOf('-');
        if (dash <= 0 || dash == key.length() - 1) return key;

        String trxnId = key.substring(0, dash).trim().toUpperCase(Locale.ROOT);
        String numPart = key.substring(dash + 1).trim();

        Integer trxnNumber;
        try {
            trxnNumber = Integer.valueOf(numPart);
        } catch (NumberFormatException e) {
            return key;
        }

        return trxnMasterRepository.findByTrxnIdAndTrxnNumber(trxnId, trxnNumber)
                .map(TrxnMaster::getTrxnName)
                .filter(name -> name != null && !name.isBlank())
                .orElse(key);
    }

    private String typeCodeOf(String studentId) {
        if (studentId == null || !studentId.toUpperCase(Locale.ROOT).startsWith("LS")) return "";
        String rest = studentId.substring(2);
        int dashIdx = rest.indexOf('-');
        return dashIdx > 0 ? rest.substring(0, dashIdx) : rest;
    }


    public ReportDailyActivityResponse dailyActivity(String studentId, Integer studentNumber, Integer month, Integer year) {

        StudentMaster master = studentMasterRepository.findByStudentIdAndStudentNumber(
                        studentId.trim().toUpperCase(Locale.ROOT), studentNumber)
                .orElseThrow(() -> ApiException.notFound(
                        "Student ID \"" + studentId + "\" / No. " + studentNumber + " not found."));

        ReportDailyActivityHeader header = new ReportDailyActivityHeader(
                master.getStudentId(),
                master.getStudentNumber(),
                master.getStudentName(),
                typeCodeOf(master.getStudentId()),
                master.getJoiningDate(),
                resolveTrainerName(master.getAssignedStaff()),
                master.getMobileNo()
        );

        List<ReportDailyActivityRow> rows = activityRows(studentId, studentNumber, month, year);

        return new ReportDailyActivityResponse(header, rows);
    }

    private List<ReportDailyActivityRow> activityRows(String studentId, Integer studentNumber, Integer month, Integer year) {
        return filterStudentDets(studentId, studentNumber, month, year).stream()
                .map(this::toRow)
                .collect(Collectors.toList());
    }


    private List<StudentDet> filterStudentDets(String studentId, Integer studentNumber, Integer month, Integer year) {

        List<StudentDet> all = studentDetRepository.findByStudentIdIgnoreCaseAndStudentNumber(
                studentId.trim(), studentNumber);

        return all.stream()
                .filter(d -> "A".equalsIgnoreCase(d.getDelFlag()))
                .filter(d -> matchesMonthYear(d.getTranDate(), month, year))
                .sorted(Comparator.comparing(StudentDet::getTranDate, Comparator.nullsLast(Comparator.naturalOrder()))
                        .thenComparing(StudentDet::getTranNumber, Comparator.nullsLast(Comparator.naturalOrder()))
                        .thenComparing(StudentDet::getEntrySeq, Comparator.nullsLast(Comparator.naturalOrder())))
                .collect(Collectors.toList());
    }

    private boolean matchesMonthYear(LocalDate tranDate, Integer month, Integer year) {
        if (tranDate == null) return false;
        if (month != null && tranDate.getMonthValue() != month) return false;
        if (year != null && tranDate.getYear() != year) return false;
        return true;
    }

    private ReportDailyActivityRow toRow(StudentDet d) {
        return new ReportDailyActivityRow(
                d.getTranId(),
                d.getTranNumber(),
                d.getEntrySeq(),
                d.getTranDate(),
                d.getBackValueDate(),
                d.getAttendInTime(),
                d.getAttendOutTime(),
                d.getTechnology(),
                d.getNarration(),
                d.getTranParticular(),
                d.getCourseId(),
                d.getCourseDetId(),
                d.getNarration(),
                d.getRemarks()
        );
    }



    public List<ReportStudentActivitySummary> searchActivities(
            String studentType, String tranParticular, Integer studentNumber, boolean currentDayOnly) {

        return latestActivityByStudentForReport(studentType, tranParticular, studentNumber, currentDayOnly)
                .values().stream()
                .map(this::toActivitySummary)
                .sorted(Comparator.comparing(ReportStudentActivitySummary::getStudentName,
                        Comparator.nullsLast(String::compareToIgnoreCase)))
                .collect(Collectors.toList());
    }

    private Map<String, StudentDet> latestActivityByStudentForReport(
            String studentType, String tranParticular, Integer studentNumber, boolean currentDayOnly) {

        List<StudentDet> filtered = filterStudentDetsForList(studentType, tranParticular, studentNumber).stream()
                .filter(d -> !currentDayOnly || LocalDate.now().equals(d.getTranDate()))
                .collect(Collectors.toList());

        Comparator<StudentDet> byRecency = Comparator
                .comparing(StudentDet::getTranDate, Comparator.nullsLast(Comparator.naturalOrder()))
                .thenComparing(StudentDet::getTranNumber, Comparator.nullsLast(Comparator.naturalOrder()))
                .thenComparing(StudentDet::getEntrySeq, Comparator.nullsLast(Comparator.naturalOrder()));


        Map<String, StudentDet> latest = new LinkedHashMap<>();
        for (StudentDet d : filtered) {
            String particularKey = d.getTranParticular() == null ? "" : d.getTranParticular().trim();
            String key = d.getStudentId() + "::" + d.getStudentNumber() + "::" + particularKey;
            StudentDet current = latest.get(key);
            if (current == null || byRecency.compare(d, current) > 0) {
                latest.put(key, d);
            }
        }

        return latest;
    }

    private ReportStudentActivitySummary toActivitySummary(StudentDet d) {

        StudentMaster master = studentMasterRepository
                .findByStudentIdAndStudentNumber(d.getStudentId(), d.getStudentNumber())
                .orElse(null);

        String trainerName = master != null ? resolveTrainerName(master.getAssignedStaff()) : "";
        Long mobileNo = master != null ? master.getMobileNo() : null;

        return new ReportStudentActivitySummary(
                d.getStudentId(),
                d.getStudentNumber(),
                d.getStudentName(),
                typeCodeOf(d.getStudentId()),
                trainerName,
                mobileNo,
                d.getTranDate(),
                d.getTechnology(),
                d.getTranId(),
                d.getTranNumber(),
                d.getEntrySeq(),
                d.getTranParticular(),
                d.getNarration()
        );
    }



    public List<ReportDailyActivityListRow> searchActivityRows(
            String studentType, String tranParticular, Integer studentNumber, boolean currentDayOnly) {

        return filterStudentDetsForList(studentType, tranParticular, studentNumber).stream()
                .filter(d -> !currentDayOnly || LocalDate.now().equals(d.getTranDate()))
                .map(this::toListRow)
                .collect(Collectors.toList());
    }

    private ReportDailyActivityListRow toListRow(StudentDet d) {

        StudentMaster master = studentMasterRepository
                .findByStudentIdAndStudentNumber(d.getStudentId(), d.getStudentNumber())
                .orElse(null);

        String trainerName = master != null ? resolveTrainerName(master.getAssignedStaff()) : "";
        Long mobileNo = master != null ? master.getMobileNo() : null;

        return new ReportDailyActivityListRow(
                d.getStudentId(),
                d.getStudentNumber(),
                d.getStudentName(),
                typeCodeOf(d.getStudentId()),
                trainerName,
                mobileNo,
                d.getTranDate(),
                d.getTechnology(),
                d.getTranParticular(),
                d.getNarration(),
                d.getAttendInTime(),
                d.getAttendOutTime(),
                d.getRemarks(),
                d.getTranId(),
                d.getTranNumber()
        );
    }


    private static final String[] STUDENT_EXPORT_HEADERS = {
            "Student ID", "Student No", "Student Name", "Study Mode", "Assigned Staff",
            "Batch", "Native Place", "Joining Date", "Mobile No", "Emergency Contact No",
            "Relationship", "Email ID", "Qualification", "College Name", "Passout Year",
            "Experience", "Reference By", "Paid Status", "Total Agreed Fee",
            "Duration Frequency", "Total Duration", "Student Status", "Entry By",
            "Entry Date", "Del Flag"
    };


    private static final int[] STUDENT_EXPORT_WIDTHS = {
            12, 10, 22, 14, 18,
            10, 18, 14, 14, 18,
            14, 26, 18, 26, 12,
            14, 16, 12, 16,
            18, 14, 14, 14,
            14, 10
    };

    public ExportFileResponse exportStudents(String name, String studentType, Integer studentNumber, String format) {

        List<StudentMaster> rows = filterStudentMasters(name, studentType, studentNumber);

        if (isExcel(format)) {
            byte[] bytes = buildStudentsExcel(rows);
            return fileResponse("student-report.xlsx", XLSX_CONTENT_TYPE, bytes);
        }
        if (isPdf(format)) {
            byte[] bytes = buildStudentsPdf(rows);
            return fileResponse("student-report.pdf", PDF_CONTENT_TYPE, bytes);
        }
        throw ApiException.badRequest("Invalid download option. Choose either Excel or PDF.");
    }

    private String[] studentExportRow(StudentMaster s) {
        return new String[]{
                nvl(s.getStudentId()),
                s.getStudentNumber() == null ? "" : String.valueOf(s.getStudentNumber()),
                nvl(s.getStudentName()),
                nvl(s.getStudyMode()),
                resolveTrainerName(s.getAssignedStaff()),
                s.getBatch() == null ? "" : String.valueOf(s.getBatch()),
                nvl(s.getNativePlace()),
                s.getJoiningDate() == null ? "" : s.getJoiningDate().toString(),
                s.getMobileNo() == null ? "" : String.valueOf(s.getMobileNo()),
                s.getEmergencyContactNo() == null ? "" : String.valueOf(s.getEmergencyContactNo()),
                nvl(s.getRelationship()),
                nvl(s.getEmailId()),
                nvl(s.getQualification()),
                nvl(s.getCollegeName()),
                s.getPassoutYear() == null ? "" : String.valueOf(s.getPassoutYear()),
                nvl(s.getExperience()),
                nvl(s.getReferenceBy()),
                nvl(s.getPaidStatus()),
                s.getTotalAgreedFee() == null ? "" : String.valueOf(s.getTotalAgreedFee()),
                nvl(s.getDurationFrequency()),
                s.getTotalDuration() == null ? "" : String.valueOf(s.getTotalDuration()),
                nvl(s.getStdStatus()),
                nvl(s.getEntryBy()),
                s.getEntryDate() == null ? "" : s.getEntryDate().toString(),
                nvl(s.getDelFlag())
        };
    }

    private byte[] buildStudentsExcel(List<StudentMaster> rows) {
        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Students");
            CellStyle headerStyle = headerStyle(workbook);

            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < STUDENT_EXPORT_HEADERS.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(STUDENT_EXPORT_HEADERS[i]);
                cell.setCellStyle(headerStyle);
            }

            int r = 1;
            for (StudentMaster s : rows) {
                Row row = sheet.createRow(r++);
                String[] values = studentExportRow(s);
                for (int c = 0; c < values.length; c++) {
                    row.createCell(c).setCellValue(values[c]);
                }
            }

            setColumnWidths(sheet, STUDENT_EXPORT_WIDTHS);

            if (!rows.isEmpty()) {
                sheet.setAutoFilter(new org.apache.poi.ss.util.CellRangeAddress(
                        0, rows.size(), 0, STUDENT_EXPORT_HEADERS.length - 1));
            }

            workbook.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            throw ApiException.badRequest("Failed to generate Excel report: " + e.getMessage());
        }
    }

    private byte[] buildStudentsPdf(List<StudentMaster> rows) {
        List<String[]> data = rows.stream().map(this::studentExportRow).collect(Collectors.toList());
        return buildPdfTable("Student Information Report", STUDENT_EXPORT_HEADERS, data, STUDENT_EXPORT_WIDTHS);
    }


    private static final String[] DAILY_ACTIVITY_EXPORT_HEADERS = {
            "Student ID", "Student No", "Student Name", "Tran Name", "Technology",
            "Tran Date", "Value Date", "Time In", "Time Out", "Tran ID", "Tran No",
            "Tran Particular", "Course ID", "Course No", "Narration", "Remarks",
            "Entry By", "Entry Date", "Del Flag"
    };


    private static final int[] DAILY_ACTIVITY_EXPORT_WIDTHS = {
            12, 10, 22, 18, 16,
            12, 12, 10, 10, 10, 10,
            22, 10, 10, 30, 22,
            14, 14, 10
    };

    public ExportFileResponse exportDailyActivity(String studentId, Integer studentNumber, Integer month, Integer year, String format) {


        ReportDailyActivityHeader header = dailyActivity(studentId, studentNumber, month, year).getHeader();
        List<StudentDet> rows = filterStudentDets(studentId, studentNumber, month, year);

        String fileSuffix = header.getStudentId() + "-" + header.getStudentNumber();

        if (isExcel(format)) {
            byte[] bytes = buildDailyActivityExcel(rows);
            return fileResponse("daily-activity-" + fileSuffix + ".xlsx", XLSX_CONTENT_TYPE, bytes);
        }
        if (isPdf(format)) {
            byte[] bytes = buildDailyActivityPdf(header, rows);
            return fileResponse("daily-activity-" + fileSuffix + ".pdf", PDF_CONTENT_TYPE, bytes);
        }
        throw ApiException.badRequest("Invalid download option. Choose either Excel or PDF.");
    }


    public ExportFileResponse exportActivities(String studentType, String tranParticular, Integer studentNumber, String format) {

        List<StudentDet> rows = filterStudentDetsForList(studentType, tranParticular, studentNumber);

        if (isExcel(format)) {
            byte[] bytes = buildDailyActivityExcel(rows);
            return fileResponse("student-daily-activity.xlsx", XLSX_CONTENT_TYPE, bytes);
        }
        if (isPdf(format)) {
            byte[] bytes = buildPdfTable("Student Daily Activity Report", DAILY_ACTIVITY_EXPORT_HEADERS,
                    rows.stream().map(this::dailyActivityExportRow).collect(Collectors.toList()),
                    DAILY_ACTIVITY_EXPORT_WIDTHS);
            return fileResponse("student-daily-activity.pdf", PDF_CONTENT_TYPE, bytes);
        }
        throw ApiException.badRequest("Invalid download option. Choose either Excel or PDF.");
    }

    private List<StudentDet> filterStudentDetsForList(String studentType, String tranParticular, Integer studentNumber) {

        String typeFilter = (studentType == null) ? "" : studentType.trim().toUpperCase(Locale.ROOT);

        List<String> particularFilter = (tranParticular == null || tranParticular.isBlank())
                ? List.of()
                : java.util.Arrays.stream(tranParticular.split(","))
                    .map(String::trim)
                    .filter(v -> !v.isEmpty())
                    .collect(Collectors.toList());

        List<StudentDet> all = studentDetRepository.findAll().stream()
                .filter(d -> "A".equalsIgnoreCase(d.getDelFlag()))
                .collect(Collectors.toList());

        return all.stream()
                .filter(d -> typeFilter.isEmpty() || typeCodeOf(d.getStudentId()).equalsIgnoreCase(typeFilter))
                .filter(d -> particularFilter.isEmpty()
                        || particularFilter.stream().anyMatch(v -> v.equalsIgnoreCase(nvl(d.getTranParticular()).trim())))
                .filter(d -> studentNumber == null || studentNumber.equals(d.getStudentNumber()))
                .sorted(Comparator.comparing(StudentDet::getTranDate, Comparator.nullsLast(Comparator.naturalOrder()))
                        .thenComparing(StudentDet::getTranNumber, Comparator.nullsLast(Comparator.naturalOrder()))
                        .thenComparing(StudentDet::getEntrySeq, Comparator.nullsLast(Comparator.naturalOrder())))
                .collect(Collectors.toList());
    }

    private String[] dailyActivityExportRow(StudentDet d) {
        return new String[]{
                nvl(d.getStudentId()),
                d.getStudentNumber() == null ? "" : String.valueOf(d.getStudentNumber()),
                nvl(d.getStudentName()),
                nvl(d.getTranName()),
                nvl(d.getTechnology()),
                d.getTranDate() == null ? "" : d.getTranDate().toString(),
                d.getBackValueDate() == null ? "" : d.getBackValueDate().toString(),
                d.getAttendInTime() == null ? "" : d.getAttendInTime().toString(),
                d.getAttendOutTime() == null ? "" : d.getAttendOutTime().toString(),
                nvl(d.getTranId()),
                d.getTranNumber() == null ? "" : String.valueOf(d.getTranNumber()),
                nvl(d.getTranParticular()),
                nvl(d.getCourseId()),
                d.getCourseDetId() == null ? "" : String.valueOf(d.getCourseDetId()),
                nvl(d.getNarration()),
                nvl(d.getRemarks()),
                nvl(d.getEntryBy()),
                d.getEntryDate() == null ? "" : d.getEntryDate().toString(),
                nvl(d.getDelFlag())
        };
    }

    private byte[] buildDailyActivityExcel(List<StudentDet> rows) {
        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Daily Activity");
            CellStyle headerStyle = headerStyle(workbook);

            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < DAILY_ACTIVITY_EXPORT_HEADERS.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(DAILY_ACTIVITY_EXPORT_HEADERS[i]);
                cell.setCellStyle(headerStyle);
            }

            int r = 1;
            for (StudentDet d : rows) {
                Row xrow = sheet.createRow(r++);
                String[] values = dailyActivityExportRow(d);
                for (int c = 0; c < values.length; c++) {
                    xrow.createCell(c).setCellValue(values[c]);
                }
            }

            setColumnWidths(sheet, DAILY_ACTIVITY_EXPORT_WIDTHS);


            if (!rows.isEmpty()) {
                sheet.setAutoFilter(new org.apache.poi.ss.util.CellRangeAddress(
                        0, rows.size(), 0, DAILY_ACTIVITY_EXPORT_HEADERS.length - 1));
            }

            workbook.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            throw ApiException.badRequest("Failed to generate Excel report: " + e.getMessage());
        }
    }

    private byte[] buildDailyActivityPdf(ReportDailyActivityHeader h, List<StudentDet> rows) {
        String title = "Daily Activity Report - " + nvl(h.getStudentId()) + "-" + h.getStudentNumber()
                + " (" + nvl(h.getStudentName()) + ")";

        List<String[]> data = rows.stream().map(this::dailyActivityExportRow).collect(Collectors.toList());

        return buildPdfTable(title, DAILY_ACTIVITY_EXPORT_HEADERS, data, DAILY_ACTIVITY_EXPORT_WIDTHS);
    }



    private static final String XLSX_CONTENT_TYPE =
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    private static final String PDF_CONTENT_TYPE = "application/pdf";

    private boolean isExcel(String format) {
        return format != null && (format.equalsIgnoreCase("excel") || format.equalsIgnoreCase("xlsx"));
    }

    private boolean isPdf(String format) {
        return format != null && format.equalsIgnoreCase("pdf");
    }

    private ExportFileResponse fileResponse(String fileName, String contentType, byte[] bytes) {
        return new ExportFileResponse(fileName, contentType, Base64.getEncoder().encodeToString(bytes));
    }

    private String nvl(Object o) {
        return o == null ? "" : String.valueOf(o);
    }


    private void setColumnWidths(Sheet sheet, int[] widthsInChars) {
        for (int i = 0; i < widthsInChars.length; i++) {

            sheet.setColumnWidth(i, (widthsInChars[i] + 2) * 256);
        }
    }

    private CellStyle headerStyle(XSSFWorkbook workbook) {
        CellStyle style = workbook.createCellStyle();
        org.apache.poi.ss.usermodel.Font font = workbook.createFont();
        font.setBold(true);
        font.setColor(IndexedColors.WHITE.getIndex());
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
        style.setFillPattern(org.apache.poi.ss.usermodel.FillPatternType.SOLID_FOREGROUND);
        return style;
    }

    private byte[] buildPdfTable(String title, String[] headers, List<String[]> rows, int[] relativeWidths) {
        try {
            Document document = new Document(PageSize.A4.rotate(), 24, 24, 32, 32);
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            PdfWriter.getInstance(document, out);
            document.open();

            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14);
            document.add(new Paragraph(title, titleFont));
            document.add(new Paragraph(" "));

            PdfPTable table = new PdfPTable(headers.length);
            table.setWidthPercentage(100);
            if (relativeWidths != null && relativeWidths.length == headers.length) {
                try {
                    float[] widths = new float[relativeWidths.length];
                    for (int i = 0; i < relativeWidths.length; i++) widths[i] = relativeWidths[i];
                    table.setWidths(widths);
                } catch (Exception ignored) {

                }
            }

            Font headFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, Font.NORMAL, java.awt.Color.WHITE);
            for (String head : headers) {
                PdfPCell cell = new PdfPCell(new Paragraph(head, headFont));
                cell.setBackgroundColor(new java.awt.Color(30, 41, 59));
                cell.setPadding(5);
                cell.setHorizontalAlignment(Element.ALIGN_LEFT);
                table.addCell(cell);
            }

            Font bodyFont = FontFactory.getFont(FontFactory.HELVETICA, 8.5f);
            for (String[] row : rows) {
                for (String value : row) {
                    PdfPCell cell = new PdfPCell(new Paragraph(value == null ? "" : value, bodyFont));
                    cell.setPadding(4);
                    table.addCell(cell);
                }
            }

            if (rows.isEmpty()) {
                PdfPCell empty = new PdfPCell(new Paragraph("No records found.", bodyFont));
                empty.setColspan(headers.length);
                empty.setPadding(6);
                table.addCell(empty);
            }

            document.add(table);
            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw ApiException.badRequest("Failed to generate PDF report: " + e.getMessage());
        }
    }
}
