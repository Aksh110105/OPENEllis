package org.openelisglobal.analyzer.form;

import java.util.List;

import org.openelisglobal.validation.annotations.SafeHtml;
import org.openelisglobal.common.form.BaseForm;

public class ListPluginForm extends BaseForm {

    private List<@SafeHtml String> pluginList;

    public ListPluginForm() {
        setFormName("listPluginForm");
    }

    public List<String> getPluginList() {
        return pluginList;
    }

    public void setPluginList(List<String> pluginList) {
        this.pluginList = pluginList;
    }
}
