import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { DashboardService } from '../../services/dashboard.service';
import { ToastService } from '../../services/toast.service';
import { DashboardCountItem, DashboardSummary } from '../../models/dashboard.model';


interface DashTile {
  title: string;
  value: number;
  color: string;
  colorSoft: string;
  code: string;
  
  isTotal: boolean;
}

@Component({
  selector: 'app-reports-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reports-dashboard.component.html',
  styleUrl: './reports-dashboard.component.css'
})
export class ReportsDashboardComponent implements OnInit {

  loading = false;
  summary: DashboardSummary | null = null;

  studentMasterTiles: DashTile[] = [];
  studentActivityTiles: DashTile[] = [];


  private readonly palette: { solid: string; soft: string }[] = [
    { solid: '#1B2A47', soft: '#EBF0FA' }, // primary navy
    { solid: '#2563EB', soft: '#DBEAFE' }, // accent blue
    { solid: '#C97B3C', soft: '#FBEADD' }, // warn amber
    { solid: '#0E9488', soft: '#DCFCF6' }, // teal
    { solid: '#7C3AED', soft: '#EDE4FD' }, // violet
    { solid: '#E53E3E', soft: '#FEE2E2' }, // danger rose
    { solid: '#2E7D5B', soft: '#E4F2EC' }, // success green
    { solid: '#0F766E', soft: '#DCF5F3' }, // deep teal
    { solid: '#B45309', soft: '#FDECD2' }, // burnt orange
    { solid: '#334155', soft: '#E7EBF0' }, // slate
  ];

  constructor(
    private dashboardSvc: DashboardService,
    private toast: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.load();
  }

  
  onMasterTileClick(tile: DashTile): void {
    this.router.navigate(['/report'], {
      queryParams: { studentType: tile.code || null, returnTo: '/dashboard' }
    });
  }

 
  onActivityTileClick(tile: DashTile): void {
    this.router.navigate(['/report-activity'], {
      queryParams: { tranParticular: tile.code || null, returnTo: '/dashboard' }
    });
  }

  load(): void {
    this.loading = true;
    this.dashboardSvc.getSummary().subscribe({
      next: summary => {
        this.summary = summary;
        this.buildTiles(summary);
        this.loading = false;
      },
      error: (err: Error) => {
        this.loading = false;
        this.toast.error(err.message);
      }
    });
  }

  private buildTiles(summary: DashboardSummary): void {

    let colorIdx = 0;
    const nextColor = () => this.palette[colorIdx++ % this.palette.length];

    const totalStudentColor = nextColor();
    this.studentMasterTiles = [
      {
        title: 'Total Students',
        value: summary.totalStudents,
        color: totalStudentColor.solid,
        colorSoft: totalStudentColor.soft,
        code: '',
        isTotal: true
      },
      ...summary.studentMasterCounts.map(item => this.toTile(item, nextColor()))
    ];

    const totalActivityColor = nextColor();
    this.studentActivityTiles = [
      {
        title: 'Total Activity Students',
        value: summary.totalActivityStudents,
        color: totalActivityColor.solid,
        colorSoft: totalActivityColor.soft,
        code: '',
        isTotal: true
      },
      ...summary.studentActivityCounts.map(item => this.toTile(item, nextColor()))
    ];
  }

  /**
   * Tile label always mirrors the Configuration Master entry exactly as
   * typed (e.g. a Tran Particular named "Test - 3" shows as
   * "Total Students [Test - 3]") - no prefix is stripped off.
   */
  private toTile(
    item: DashboardCountItem,
    color: { solid: string; soft: string }
  ): DashTile {
    return {
      title: `Total Students [${item.label}]`,
      value: item.count,
      color: color.solid,
      colorSoft: color.soft,
      code: item.code,
      isTotal: false
    };
  }
}
