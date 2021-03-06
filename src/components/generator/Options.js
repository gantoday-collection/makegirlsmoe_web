import React, { Component } from 'react';
import { ReactHintFactory } from 'react-hint';
import { connect } from 'react-redux';
import { FormattedMessage } from "react-intl";
import 'react-hint/css/index.css';
import { Link } from 'react-router-dom';
import Config from '../../Config';
import Utils from '../../utils/Utils';
import BinarySelector from '../generator-widgets/BinarySelector';
import MultipleSelector from '../generator-widgets/MultipleSelector';
import NoiseSelector from '../generator-widgets/NoiseSelector';
import NoiseVisualizer from '../generator-widgets/NoiseVisualizer';
import ButtonGroup from '../generator-widgets/ButtonGroup';
import RandomButtonSimple from '../generator-widgets/RandomButtonSimple';
import Slider from 'rc-slider';
import SliderWithInput from '../generator-widgets/SliderWithInput';
import 'rc-slider/assets/index.css';
import ImageDecoder from '../../utils/ImageDecoder';
import PromptDialog from '../dialogs/PromptDialog';
import Dropdown from '../generator-widgets/Dropdown';
import LabelHelper from '../generator-widgets/LabelHelper';
import './Options.css';
import { generatorAction, generatorConfigAction } from '../../_actions';
import { getlanguageLength } from '../../_reducers/locale.reducers';

const ReactHint = ReactHintFactory(React);

class Options extends Component {

    constructor(props) {
        super();
        this.options = Utils.arrayToObject(props.modelConfig.options, item => item.key);
        this.state = {
            perturbRange: 0.01,
            isPerturbing: false,
            previousNoise: [],
        };
    }

    componentWillReceiveProps(newProps) {
        this.options = Utils.arrayToObject(newProps.modelConfig.options, item => item.key);
    }

    onNoiseImportClick() {
        this.refs.noiseUploader.click();
    }

    onNoiseExportClick() {
        if (!this.props.inputs.noise.value) {
            return;
        }

        this.alertDialog.show('Noise Export',
            <div>
                <p>
                    Please save the image below. <br />
                    For PC User: Right-click on the image and click "Save Image As". <br />
                    For Mac User: Click on the image and drag to desktop or desired folder.<br />
                    For Mobile Device User: Touch and hold the image, and tap "Save Image"<br />
                </p>
                <p>
                    <b>Note: Conditions such as hair color, whether random or specified, are NOT included in the noise. Try generating images with fixed noise and different conditions!</b>
                </p>
                Noise Image:
                <NoiseVisualizer modelConfig={this.props.modelConfig} noise={this.props.inputs.noise.value}/>
            </div>
        );
    }

    readNoise(event) {
        if (!event || !event.target || !event.target.files || !event.target.files[0]) {
            return;
        }

        var file = event.target.files[0];

        var reader = new FileReader();
        reader.onload = () => {
            var dataURL = reader.result;
            new ImageDecoder(this.props.modelConfig).DecodeNoiseOrigin(dataURL).then(noise => {
                this.props.dispatch(generatorAction.modelOptionChange('noise', false, noise));
                this.alertDialog.show('Noise Import', 'Import Successful.');
            }).catch(err => {
                this.alertDialog.show('Import Error', err.error);
            });
        };
        reader.readAsDataURL(file);
    }

    renderLabel(key, title, large = false) {
        if (!large) {
            return (
                <h5>
                    <FormattedMessage id={title || Utils.keyToString(key)}/>
                </h5>
            );
        }
        else {
            return (
                <h4>
                    <FormattedMessage id={title || Utils.keyToString(key)}/>
                </h4>
            );
        }
    }

    isBinaryOptionSimple(option) {
        return option.random || option.value === 1 || option.value === -1;
    }

    getClassShortOption() {
        if (getlanguageLength(this.props.locale) === 'long') {
            return "col-xs-12 col-md-6 option";
        }
        else {
            return "col-xs-6 col-md-4 option";
        }
    };

    getClassLongOption() {
        return "col-xs-12 col-md-12 option";
    };

    renderBinarySelector(key, title) {
        var input = this.props.inputs[key];
        return (
            <div key={key}  className={this.getClassShortOption()}>
                {this.renderLabel(key, title)}
                {(this.isBinaryOptionSimple(input) &&
                    <BinarySelector
                        value={input.random ? 0 : input.value}
                        onChange={(value) => this.props.dispatch(generatorAction.modelOptionChange(key, value === 0, value))} />) ||
                    <span><i>(User-defined)</i></span>}
            </div>
        );
    }

    isMultipleOptionSimple(option) {
        return option.random
            || (option.value.filter(v => v === 1).length === 1
                && option.value.filter(v => v === 1 || v === -1).length === option.value.length)
    }

    renderMultipleSelector(key, options, title) {
        var input = this.props.inputs[key];
        return (
            <div key={key} className={this.getClassShortOption()}>
                {this.renderLabel(key, title)}
                {(this.isMultipleOptionSimple(input) &&
                    <MultipleSelector
                        options={options}
                        value={input.random ? 0 : input.value.indexOf(1) + 1}
                        onChange={(value) => this.props.dispatch(
                            generatorAction.modelOptionChange(
                                key, value === 0, Array.apply(null, {length: options.length}).map((item, index) => index === value - 1 ? 1 : -1)
                            )
                        )} />) ||
                    <span><i>(User-defined)</i></span>}
            </div>
        );
    }

    renderContinuousSelector(key, config, title) {
        var input = this.props.inputs[key];
        return (
            <div key={key} className={this.getClassShortOption()}>
                {this.renderLabel(key, title)}
                <div className="flex">
                    <div>
                        <RandomButtonSimple
                            value={input.random ? 1 : 0}
                            onChange={(value) => this.props.dispatch(generatorAction.modelOptionChange(key, value === 1))}/>
                    </div>
                    <div className="flex-grow continuous-selector-slider">
                        <Slider min={config.min} max={config.max} step={config.step} value={Utils.clamp(input.value, config.min, config.max)}
                              onBeforeChange={() => this.props.dispatch(generatorAction.modelOptionChange(key, false))}
                              onChange={value => this.props.dispatch(generatorAction.modelOptionChange(key, false, value))}/>
                    </div>
                </div>
            </div>
        );
    }

    renderNoiseSelector() {
        return (
            <div className={this.getClassShortOption()}>
                {this.renderLabel('noise')}
                <NoiseSelector value={this.props.inputs.noise.random ? 0 : 1}
                               onChange={(value) => this.props.dispatch(generatorAction.modelOptionChange('noise', value === 0))}
                />
            </div>
        );
    }

    renderSelector(key) {
        var option = this.options[key];
        if (option.type === 'multiple') {
            return this.renderMultipleSelector(key, option.options);
        } else if (option.type === 'continuous') {
            return this.renderContinuousSelector(key, option)
        } else {
            return this.renderBinarySelector(key);
        }
    }

    renderNoiseVisualizer() {
        return (
            <div className={this.getClassShortOption()}>
                <h5><FormattedMessage id="CurrentNoise"/></h5>
                <NoiseVisualizer modelConfig={this.props.modelConfig} noise={this.props.inputs.noise.value} />
            </div>
        );
    }

    renderNoiseImportExport() {
        return (
            <div className={this.getClassShortOption()}>
                <h5><FormattedMessage id="NoiseImportExport"/></h5>
                {new ButtonGroup().renderButtonGroup([
                    {name: 'Import', onClick: () => this.onNoiseImportClick()},
                    {name: 'Export', onClick: () => this.onNoiseExportClick()}
                ])}
                <input type="file" accept="image/*" ref="noiseUploader" style={{display: "none"}} onChange={(event) => this.readNoise(event)} onClick={(event)=> {event.target.value = null}} />
            </div>
        )
    }

    renderOperations() {
        return (
            <div className={this.getClassShortOption()}>
                <h5><FormattedMessage id="Operations"/></h5>
                {new ButtonGroup().renderButtonGroup([
                    {name: 'Import', onClick: () => this.props.onOperationClick('json_import')},
                    {name: 'Export', onClick: () => this.props.onOperationClick('json_export')},
                    {name: 'Reset', onClick: () => this.props.dispatch(generatorAction.resetGeneratorOptions())},

                ])}
            </div>
        );
    }

    renderModelSelector() {
        return (
            <div className={this.getClassLongOption()}>
                <h5><FormattedMessage id="Model"/></h5>
                <Dropdown
                    options={Config.modelList}
                    value={this.props.currentModel}
                    onChange={(value) => this.props.dispatch(generatorAction.changeGeneratorModel(value))}
                />
            </div>
        );
    }

    renderWebglOption() {
        return (
            this.props.webglAvailable &&
            <div className={this.getClassShortOption()}>
                <h5><FormattedMessage id="WebGLAcceleration"/><LabelHelper mesg="WebGLHelper"/></h5>
                {new ButtonGroup().renderButtonGroup([
                    {name: 'Disabled', isActive: this.props.webglDisabled,
                        onClick: () => this.props.dispatch(generatorConfigAction.disableWebGL())

                    },
                    {name: 'Enabled', isActive: !this.props.webglDisabled,
                        onClick: () => this.props.dispatch(generatorConfigAction.enableWebGL())
                    }
                ])}
            </div>
        );
    }

    renderRemoteComputing() {
        return (
            <div className={this.getClassShortOption()}>
                <h5><FormattedMessage id="Remote Computing"/></h5>
                {new ButtonGroup().renderButtonGroup([
                    {name: 'Disabled', isActive: !this.props.remoteComputing,
                        onClick: () => this.props.dispatch(generatorConfigAction.setRemoteComputing(false))

                    },
                    {name: 'Enabled', isActive: this.props.remoteComputing,
                        onClick: () => this.props.dispatch(generatorConfigAction.setRemoteComputing(true))
                    }
                ])}
            </div>
        );
    }

    renderBackendName() {
        var backendNameDict = {'webgpu': 'WebGPU', 'webgl': 'WebGL', 'webassembly': 'WebAssembly'};
        return (
            this.props.backendName &&
            <div className={this.getClassShortOption()}>
                <h5><FormattedMessage id="CurrentBackend"/></h5>
                <span>{backendNameDict[this.props.backendName] || 'Unknown'}</span>
            </div>
        );
    }

    renderCountOption() {
        var isMultiple = this.props.count !== 1;
        return (
            <div className={this.getClassLongOption()}>
                <h5><FormattedMessage id="Generate Multiple Images"/></h5>
                <div className="flex">
                    <div>
                        {new ButtonGroup().renderButtonGroup([{
                            key: 'Enabled',
                            name: <span><span className={"option-checkbox glyphicon " + (isMultiple ? " glyphicon-check" : " glyphicon-unchecked")}/><FormattedMessage id="Enabled"/></span>,
                            isActive: isMultiple,
                            onClick: () => this.props.dispatch(generatorConfigAction.setCount(isMultiple ? 1 : 2))
                        }])}
                    </div>
                    <div className="flex-grow option-count-slider" style={{display: isMultiple ? 'block' : 'none'}}>
                        <SliderWithInput min={2} max={20} step={1} value={this.props.count || 1}
                                         onChange={value => this.props.dispatch(generatorConfigAction.setCount(value))}/>
                    </div>
                </div>
            </div>
        );
    }

    renderPerturbNoise() {
        //Only show this in expert mode.
    }


    renderAllOptions(){
        return Object.keys(this.options).map(item => this.renderSelector(item));
    }

    render() {
        return (
            <div className="options">
                <div className="row">
                    <h3 className="col-xs-3 col-md-2" style={{color: Config.colors.theme}}><FormattedMessage id="Options"/></h3>
                    <span className="col-xs-6 mode-selector">
                        <input type="checkbox" checked={this.props.mode === 'expert'} onChange={event => this.props.onOptionChange('mode', event.target.checked ? 'expert' : 'normal')} />
                        <span><FormattedMessage id="ExpertMode"/></span>
                    </span>
                </div>
                <div className="row">
                    {this.renderModelSelector()}
                </div>
                <div className="row">
                    {this.renderAllOptions()}
                </div>
                <div className="row">
                    {this.renderNoiseSelector()}
                    {this.props.inputs.noise.value && this.renderNoiseVisualizer()}
                    {this.renderNoiseImportExport()}
                </div>
                <div className="row">
                    {this.renderPerturbNoise()}
                </div>
                <div className="row">
                    {this.renderOperations()}
                    {this.renderWebglOption()}
                    {/*this.renderRemoteComputing()*/}
                </div>
                <div className="row">
                    {this.renderBackendName()}
                </div>
                <div className="row">
                    {this.renderCountOption()}
                </div>

                <div className="row">
                    <div className="col-xs-12 license-hint">
                        <FormattedMessage
                            id="Note"
                            values={{here: <Link to="/license"><FormattedMessage id="Here" /></Link>}}
                        />
                    </div>
                </div>

                <PromptDialog type="alert" ref={dialog => this.alertDialog = dialog} />
                <ReactHint events delay={100} />
            </div>
        );
    }
}

function mapStateToProps(state) {
    return {
        webglAvailable: state.generatorConfig.webglAvailable,
        webglDisabled: state.generatorConfig.webglDisabled,
        remoteComputing: state.generatorConfig.remoteComputing,
        currentModel: state.generator.currentModel,
        locale: state.selectLocale.locale,
        inputs: state.generator.options,
        count: state.generatorConfig.count,
    };
}

export default connect(mapStateToProps)(Options);
export {Options as OptionsClass}
