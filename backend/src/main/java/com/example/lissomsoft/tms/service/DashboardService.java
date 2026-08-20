package com.example.lissomsoft.tms.service;

import com.example.lissomsoft.tms.dto.DashboardCountItem;
import com.example.lissomsoft.tms.dto.DashboardSummaryResponse;
import com.example.lissomsoft.tms.entity.ConfigDet;
import com.example.lissomsoft.tms.entity.StudentDet;
import com.example.lissomsoft.tms.entity.StudentMaster;
import com.example.lissomsoft.tms.repository.ConfigDetRepository;
import com.example.lissomsoft.tms.repository.StudentDetRepository;
import com.example.lissomsoft.tms.repository.StudentMasterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardService {

    private static final String STUD_CONFIG_MASTER = "STUD";

    private record ActivityBucket(String code, String label, Set<String> values) {
        boolean matches(String tranParticular) {
            if (tranParticular == null) return false;
            String trimmed = tranParticular.trim();
            return values.stream().anyMatch(v -> v.equalsIgnoreCase(trimmed));
        }
    }


    private static final List<ActivityBucket> ACTIVITY_BUCKETS = List.of(
            new ActivityBucket("IN_PROGRESS", "In Progress", Set.of("In Progress")),
            new ActivityBucket("COMPLETED", "Completed", Set.of("Completed")),
            new ActivityBucket("LEFT_DROPPED", "Left / Dropped", Set.of("Left", "Dropped")),
            new ActivityBucket("SHIFTED", "Shifted to Main office", Set.of("Shifted to Main office"))
    );

    private final StudentMasterRepository studentMasterRepository;
    private final StudentDetRepository studentDetRepository;
    private final ConfigDetRepository configDetRepository;

    public DashboardSummaryResponse summary() {

        List<StudentMaster> activeStudents = studentMasterRepository.findAll().stream()
                .filter(s -> "A".equalsIgnoreCase(s.getDelFlag()))
                .collect(Collectors.toList());

        return new DashboardSummaryResponse(
                activeStudents.size(),
                studentMasterCounts(activeStudents),
                distinctActivityStudentCount(),
                studentActivityCounts()
        );
    }


    private List<DashboardCountItem> studentMasterCounts(List<StudentMaster> activeStudents) {

        List<ConfigDet> studentTypes = configDetRepository.findByConfigMaster(STUD_CONFIG_MASTER).stream()
                .filter(c -> "A".equalsIgnoreCase(c.getDelFlag()))
                .filter(c -> c.getConfigName() != null && !"Employee".equalsIgnoreCase(c.getConfigName().trim()))
                .collect(Collectors.toList());

        Map<String, Long> countByCode = activeStudents.stream()
                .map(s -> typeCodeOf(s.getStudentId()))
                .collect(Collectors.groupingBy(code -> code, Collectors.counting()));

        List<DashboardCountItem> items = new ArrayList<>();
        for (ConfigDet type : studentTypes) {
            String code = codePrefixOf(type.getConfigName());
            long count = countByCode.getOrDefault(code, 0L);
            items.add(new DashboardCountItem(code, type.getConfigName(), count));
        }
        return items;
    }

    private String codePrefixOf(String configName) {
        if (configName == null) return "";
        String name = configName.trim();
        int dash = name.indexOf('-');
        return (dash > 0 ? name.substring(0, dash) : name).trim().toUpperCase(Locale.ROOT);
    }

    private String typeCodeOf(String studentId) {
        if (studentId == null || !studentId.toUpperCase(Locale.ROOT).startsWith("LS")) return "";
        String rest = studentId.substring(2);
        int dashIdx = rest.indexOf('-');
        return (dashIdx > 0 ? rest.substring(0, dashIdx) : rest).toUpperCase(Locale.ROOT);
    }


    private long distinctActivityStudentCount() {
        return latestActivityByStudent().size();
    }

    private List<DashboardCountItem> studentActivityCounts() {

        Map<String, Long> countByBucketCode = new LinkedHashMap<>();
        for (ActivityBucket bucket : ACTIVITY_BUCKETS) {
            countByBucketCode.put(bucket.code(), 0L);
        }

        for (StudentDet d : latestActivityByStudent().values()) {
            for (ActivityBucket bucket : ACTIVITY_BUCKETS) {
                if (bucket.matches(d.getTranParticular())) {
                    countByBucketCode.merge(bucket.code(), 1L, Long::sum);
                    break; // each student's latest activity belongs to exactly one tile
                }
            }
        }

        List<DashboardCountItem> items = new ArrayList<>();
        for (ActivityBucket bucket : ACTIVITY_BUCKETS) {
            items.add(new DashboardCountItem(bucket.code(), bucket.label(), countByBucketCode.get(bucket.code())));
        }
        return items;
    }


    private Map<String, StudentDet> latestActivityByStudent() {

        List<StudentDet> active = studentDetRepository.findAll().stream()
                .filter(d -> "A".equalsIgnoreCase(d.getDelFlag()))
                .collect(Collectors.toList());

        Map<String, StudentDet> latest = new LinkedHashMap<>();
        Comparator<StudentDet> byRecency = Comparator
                .comparing(StudentDet::getTranDate, Comparator.nullsLast(Comparator.naturalOrder()))
                .thenComparing(StudentDet::getTranNumber, Comparator.nullsLast(Comparator.naturalOrder()));

        for (StudentDet d : active) {
            String key = d.getStudentId() + "::" + d.getStudentNumber();
            StudentDet current = latest.get(key);
            if (current == null || byRecency.compare(d, current) > 0) {
                latest.put(key, d);
            }
        }
        return latest;
    }
}

