import { CommonModule } from '@angular/common';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed, async } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatIconModule, MatNativeDateModule, MatProgressSpinnerModule, MatSelectModule } from '@angular/material';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { RouterTestingModule } from '@angular/router/testing';
import { AccordionModule, CalendarModule, DataListModule } from 'primeng/primeng';
import { ButtonsFilterComponent } from '../../../../components/buttons-filter/buttons-filter.component';
import { FilterSearchBoxComponent } from '../../../../components/filter-search-box/filter-search-box.component';
import { ListStixObjectComponent } from '../../../../components/list-stix-objects/list-stix-objects.component';
import { PageHeaderComponent } from '../../../../components/page/page-header.component';
import { RelationshipListComponent } from '../../../../components/relationship-list/relationship-list.component';
import { ValidationErrorsComponent } from '../../../../components/validation-errors/validation-errors.component';
import { CoreModule } from '../../../../core/core.module';
import { GenericApi } from '../../../../core/services/genericapi.service';
import { PublishedCheckboxComponent } from '../../../../global/components/published-checkbox/published-checkbox.component';
import { StixService } from '../../../stix.service';
import { RelationshipNewComponent, RelationshipsComponent } from '../../relationships';
import { CategoriesListComponent } from './categories-list.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('CategoriesListComponent', () => {
  let component: CategoriesListComponent;
  let fixture: ComponentFixture<CategoriesListComponent>;

  beforeEach(async(() => {
    const materialModules = [
      MatAutocompleteModule,
      MatButtonModule,
      MatCardModule,
      MatChipsModule,
      MatCheckboxModule,
      MatDatepickerModule,
      MatExpansionModule,
      MatSnackBarModule,
      MatInputModule,
      MatIconModule,
      MatListModule,
      MatNativeDateModule,
      MatProgressSpinnerModule,
      MatSelectModule,
    ];

    const stixComponents = [
      PublishedCheckboxComponent,
      ListStixObjectComponent,
      RelationshipsComponent,
      RelationshipNewComponent,
      RelationshipListComponent,
      PageHeaderComponent,
      ValidationErrorsComponent,
      ButtonsFilterComponent,
      FilterSearchBoxComponent,
    ];

    TestBed.configureTestingModule({
      declarations: [
        CategoriesListComponent,
        ...stixComponents,
      ],
      imports: [
        CommonModule,
        CoreModule,
        FormsModule,
        RouterTestingModule,
        HttpClientTestingModule,
        CalendarModule,
        AccordionModule,
        DataListModule,
        ...materialModules,
      ],
      providers: [
        StixService,
        GenericApi,
      ],
      schemas: [NO_ERRORS_SCHEMA]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CategoriesListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
