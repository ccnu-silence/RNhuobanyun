import React, {Component} from 'react'
import {
   Image,
  Text,
  StyleSheet,
  View,
  TouchableOpacity,
  ToastAndroid,
  ListView,
  TextInput,
  ScrollView,
  Dimensions
} from 'react-native';

import styles from "./style";
import api from "../../network/ApiHelper";
import Icon from 'react-native-vector-icons/FontAwesome';
import Icons from 'react-native-vector-icons/Ionicons';
var {height, widths} = Dimensions.get('window');
import NavigationBar from 'react-native-navbar';
import NavLeftView from '../common/NavLeftView'


export default class VoteOrReceiptDetail extends React.Component {
  constructor(props) {
    super(props);
    const nav = this.props.nav;
    this.state = {
      dataSource: new ListView.DataSource({
        rowHasChanged: (row1, row2) => row1 !== row2
      }),
      userCount:0,
      UserData:[],
      isFetch:false
    };
  };
  componentDidMount() {
    var Id=this.props.optionId;
    api.Activity.getVoteOrReceiptState(Id)
      .then((resData)=>{
        if(resData.Type==1){
          this.setState({
            isFetch:true,
            UserData:resData.Data,
            dataSource: this.state.dataSource.cloneWithRows(resData.Data),
            userCount:resData.Data.length
          });
        }else{
          this.setState({
            isFetch:false
          });
        }

      })
  };
  renderUser(User) {
    return (
      <View style={styles.voteorreceView}>
        <View style={styles.voteorreceViews}>
          <View style={styles.voteorreceViewss}>
            <Image
              source={{uri:User.Avatar}}
              style={styles.itemUserimgs}
              />
            <Text style={[styles.nomText,{marginLeft:10}]}>{User.Name}</Text>
          </View>

          <View>
            <Text style={[styles.nomText,{color:'#64656B',marginLeft:3}]}>{User.CreatedTime}</Text>
          </View>

        </View>
      </View>
    );
  };
  render() {

    return (
      <View style={{flex:1,backgroundColor:'white'}}>
        <NavigationBar
          style={styles.NavSty}
          leftButton={
          <NavLeftView nav={this.props.nav} leftTitle={this.props.type==0?'投票详情':'回执详情'}/>
                   }/>
        <View style={{flex:1}}>
          {this.state.isFetch&&this.state.UserData.length==0? <View style={styles.noruleViewV}>
            <Icon
              name="exclamation-circle"
              size={50}
              color="#717171"
              />
            <Text style={styles.noruleViewText}>暂无相关数据</Text>
          </View>:
        <ListView
          dataSource={this.state.dataSource}
          renderRow={this.renderUser.bind(this)}
          style={{backgroundColor:'#ECEFF1'}}
          />}
          </View>
        <View style={{padding:12,borderTopColor: '#ECEFF1',borderTopWidth: 1,}}>
          <Text style={{color:'black',fontSize:16}}>共{this.state.userCount}人</Text>
        </View>
      </View>
    );
  }
};

