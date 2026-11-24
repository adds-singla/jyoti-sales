package com.jyotisales.controller;

import com.jyotisales.dto.DashboardAnalyticsResponse;
import com.jyotisales.dto.DashboardStatsResponse;
import com.jyotisales.service.AdminDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.IsoFields;

@RestController
@RequestMapping("/api/admin/dashboard")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminDashboardController {

    private final AdminDashboardService dashboardService;


    @GetMapping("/stats")
    public ResponseEntity<DashboardStatsResponse> stats() {
        return ResponseEntity.ok(dashboardService.getStats());
    }


    @GetMapping("/analytics")
    public ResponseEntity<DashboardAnalyticsResponse> analytics(
            @RequestParam(defaultValue = "financial_year") String period,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer day,
            @RequestParam(required = false) Integer week) {

        LocalDate today = LocalDate.now(ZoneId.of("Asia/Kolkata"));

        // Indian FY: Jan-Mar → previous April
        int fyYear = today.getMonthValue() >= 4 ? today.getYear() : today.getYear() - 1;

        int resolvedYear  = year  != null ? year  : ("financial_year".equals(period) ? fyYear : today.getYear());
        int resolvedMonth = month != null ? month : today.getMonthValue();
        int resolvedDay   = day   != null ? day   : today.getDayOfMonth();
        int resolvedWeek  = week  != null ? week  : today.get(IsoFields.WEEK_OF_WEEK_BASED_YEAR);


        int weekOrDay = "day".equals(period) ? resolvedDay : resolvedWeek;

        return ResponseEntity.ok(
                dashboardService.getAnalytics(period, resolvedYear, resolvedMonth, weekOrDay));
    }
}
