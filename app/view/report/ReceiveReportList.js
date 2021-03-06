import React, { Component } from 'react';
import {
 Image,
  Text,
  StyleSheet,
  View,
  TouchableOpacity,
  ToastAndroid,
  ScrollView,
  ListView,
  RefreshControl,
  ProgressBarAndroid,
  ActivityIndicator,
  Dimensions
  } from 'react-native';

import styles from "./style";
import api from "../../network/ApiHelper";
import Icon from 'react-native-vector-icons/FontAwesome';
import ScrollableTabView from 'react-native-scrollable-tab-view';
var {height, widths} = Dimensions.get('window');
import ReportRules from './ReportRules';
import _ from 'lodash';

var firstLoad=false;
var loaderHandler = require('react-native-busy-indicator/LoaderHandler');
var BusyIndicator = require('react-native-busy-indicator');

var getSectionData = (dataBlob, sectionID) => {
  return dataBlob[sectionID];
};
var getRowData = (dataBlob, sectionID, rowID) => {
  return dataBlob[rowID];
};

var dataSource = new ListView.DataSource({
  getRowData: getRowData,
  getSectionHeaderData: getSectionData,
  rowHasChanged: (row1, row2) => row1 !== row2,
  sectionHeaderHasChanged: (s1, s2) => s1 !== s2
});

export default class ReceiveReportList extends React.Component {
  constructor(props) {
    super(props);
    const nav = this.props.nav;
    this.state = {
      page:1,
      AllData:[],
      newdata:[],
      hasMore:false,
      firstLoad:false,
      ishave:true,
      ishavedata:false,
      isnodata:false,
      isOpen:false,
      isRefreshControl:false,
      hasActData:true,
      allList: dataSource.cloneWithRowsAndSections({},[],[])
    };
  };
  componentDidMount() {
    this.state.AllData =[];
    this.state.page= 1;
    firstLoad=true;
    loaderHandler.showLoader("加载中...");
    this.fetchData(this.props.type);
  };
  creatData(Listdata){
    var data = Listdata;
    var sectionIds = [];
    var rowIds = [];
    var blobData = {};
    var keys = _.keys(data);

    keys.forEach((o, i)=> {
      var sectionId = 'section' + i;
      sectionIds[sectionIds.length] = sectionId;
      blobData[sectionId] = o;
    });

    for (var i in keys) {
      var temp = data[keys[i]];
      var ids = [];
      for (var j = 0; j < temp.length; j++) {
        var id = 'S' + i + ',R' + j;
        blobData[id] = temp[j];
        ids[ids.length] = id;
      }
      rowIds[rowIds.length] = ids;
    }
    var dataItems={
      blobData:blobData,
      sectionIds:sectionIds,
      rowIds:rowIds
    };
    return dataItems;
  }
  fetchData(type) {
    api.Report.receivedReportList(type,this.state.page)
      .then((resData)=> {
        loaderHandler.hideLoader();
        if(resData.Type==1){
          if(resData.Data==null&&firstLoad){
            //第一次加载，且没有数据的时候
            this.setState({hasActData:false});
          }
          if(firstLoad&&this.state.AllData.length==0){
            this.state.AllData = resData.Data;
          }
          this.state.newdata=this.creatData(this.state.AllData);
          var newarr=[];
          for (var ii=0; ii < this.state.newdata.rowIds.length; ii++) {
            for(var r=0;r<this.state.newdata.rowIds[ii].length;r++){newarr.push(r)}
          }
          if(newarr&&newarr.length>0&&newarr.length<35){
            this.setState({hasMore:false});
          }
          if(resData.Data&&resData.Data.length!=0){
            this.setState({hasActData:true})
          }

          if(!firstLoad){
            var oldDataLen=newarr&&newarr.length;
            this.state.AllData=_.merge(this.state.AllData, resData.Data, function(a, b) {
              if (_.isArray(a)) {
                return a.concat(b);
              }
            });
            newarr=[];
            this.state.newdata=this.creatData(this.state.AllData);
            for (var iii=0; iii < this.state.newdata.rowIds.length; iii++) {
              for(var rr=0;rr<this.state.newdata.rowIds[iii].length;rr++){newarr.push(rr)}
            }
            if(newarr&&newarr.length==oldDataLen){
              ToastAndroid.show('没有数据咯',ToastAndroid.SHORT);
              this.setState({hasMore:false});
              this.setState({
                ishavedata:false,
                isRefreshControl:false,
                allList: dataSource.cloneWithRowsAndSections(this.state.newdata.blobData,this.state.newdata.sectionIds,this.state.newdata.rowIds),
                hasMore:false
              });
              return;
            }
          }

          this.setState({
            ishavedata:false,
            isRefreshControl:false,
            allList: dataSource.cloneWithRowsAndSections(this.state.newdata.blobData,this.state.newdata.sectionIds,this.state.newdata.rowIds)
          });
        }else{
          ToastAndroid.show('未知错误',ToastAndroid.SHORT);
          this.setState({
            isRefreshControl:false
          });
        }


      })
  }
  renderFooter() {
    return (
    this.state.ishavedata&&<View ref='footerView' style={styles.footerView}>
      <View style={{width:30,height:30,justifyContent: 'center'}}>
      <ActivityIndicator animating={true} color='blue'/>
      </View>
      <Text style={styles.footerText}>
        数据加载中……
      </Text>
    </View>);
  }
  onScroll() {
    this.state.hasMore=true
  }
  onEndReached(repType){
    if (this.state.hasMore) {
      this.state.page++;
      firstLoad=false;
      this.setState({ishavedata:true});
      switch(repType){
        case 0:
          this.fetchData(api.Report.REPORT_TYPE.DAILY);
          break;
        case 1:
          this.fetchData(api.Report.REPORT_TYPE.WEEKLY);
          break;
        case 2:
          this.fetchData(api.Report.REPORT_TYPE.MONTHLY);
          break;
        default:
          this.fetchData(api.Report.REPORT_TYPE.ALL);
          break;
      }
    }
  };
  onRefresh(repType){
    firstLoad=false;
    this.setState({
      page:1,
      AllData:[],
      hasMore:true,
      isRefreshControl:true
    });
    switch(repType){
      case 0:
        this.fetchData(api.Report.REPORT_TYPE.DAILY);
        break;
      case 1:
        this.fetchData(api.Report.REPORT_TYPE.WEEKLY);
        break;
      case 2:
        this.fetchData(api.Report.REPORT_TYPE.MONTHLY);
        break;
      default:
        this.fetchData(api.Report.REPORT_TYPE.ALL);
        break;
    }

  }

  reportdetail(Id,type){
    var typeId=0;
    switch(type){
      case "日报":
        typeId=0;
        break;
      case "周报":
        typeId=1;
        break;
      case "月报":
        typeId=2;
        break;
    }
      var reportItem = {
        Id:Id,
        type:typeId,
        typeName:"receivedReport"
      };
      this.props.nav.push({
        id: 'ReportDetail',
        reportItem: reportItem,
      });

  };
  reportItem(item){
    return (
      <TouchableOpacity onPress={this.reportdetail.bind(this,item.Id,item.ReportType)}  style={{overflow:'hidden'}}>
      <View style={styles.RlistRow}>
        <View style={styles.info}>
          <Text style={styles.text}>{item.Title}</Text>
        </View>
      </View>
      </TouchableOpacity>
    )
  };

  renderSectionHeader(sectionData,sectionID) {
    return (
      <View style={{padding: 5,paddingLeft:10,backgroundColor:'#cccccc'}}>
        <Text style={{fontSize:15,color:'black'}}>
          {sectionData}
        </Text>
      </View>
    );
  };

  render() {
    return (
      <View style={{flex: 1,backgroundColor:'#E4E4E4'}}>
          <ListView
          dataSource={this.state.allList}
          renderRow={this.reportItem.bind(this)}
          renderSectionHeader={this.renderSectionHeader.bind(this)}
          onEndReached={this.onEndReached.bind(this,this.props.type)}
          onEndReachedThreshold={1}
          onScroll={this.onScroll.bind(this)}
          renderFooter={this.renderFooter.bind(this)}
          refreshControl={
              <RefreshControl
                refreshing={this.state.isRefreshControl}
                onRefresh={this.onRefresh.bind(this,this.props.type)}
                title="Loading..."
                colors={['#ffaa66cc', '#ff00ddff', '#ffffbb33', '#ffff4444']}
              />
             }
          />
        {!this.state.hasActData?
          <View style={styles.noDataView}>
            <Icon
              name="exclamation-circle"
              size={50}
              color="#717171"
              />
            <Text style={styles.noDataViewText}>暂无汇报</Text>
          </View>:null
        }
        <BusyIndicator color='#EFF3F5' loadType={1} loadSize={10} textFontSize={15} overlayColor='#4A4A4A' textColor='white' />
      </View>
    );
  }
};

