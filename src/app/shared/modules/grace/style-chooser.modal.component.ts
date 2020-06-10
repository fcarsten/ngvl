import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { GraceStyleSettings } from './grace-graph.models';


@Component({
    selector: 'app-style-chooser-modal-content',
    templateUrl: './style-chooser.modal.component.html',
    styleUrls: ['./style-chooser.modal.component.scss']
})
export class StyleChooserModalComponent implements OnInit {

    @Input() graceStyleSettings: GraceStyleSettings;

    styleGroup: FormGroup;


    constructor(public activeModal: NgbActiveModal, private formBuilder: FormBuilder) {}


    ngOnInit() {
        this.styleGroup = this.formBuilder.group({
            minColor: this.graceStyleSettings.minColor,
            minValue: [this.graceStyleSettings.minValue, [Validators.required, Validators.pattern("^-?[0-9]*$")]],
            neutralColor: this.graceStyleSettings.neutralColor,
            neutralValue: [this.graceStyleSettings.neutralValue, [Validators.required, Validators.pattern("^-?[0-9]*$")]],
            maxColor: this.graceStyleSettings.maxColor,
            maxValue: [this.graceStyleSettings.maxValue, [Validators.required, Validators.pattern("^-?[0-9]*$")]],
            transparentNeutralColor: this.graceStyleSettings.transparentNeutralColor
        });
    }

    onSubmit() {
        this.activeModal.close(this.styleGroup.value);
    }

}
